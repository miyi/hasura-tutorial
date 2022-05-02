import React, { Fragment, useState, useEffect } from "react";
import { useSubscription, useApolloClient, gql } from "@apollo/client";
import TaskItem from "./TaskItem";

const TodoPublicList = ({ latestTodo }) => {
  const [state, setState] = useState({
    olderTodosAvailable: latestTodo ? true : false,
    newTodosCount: 0,
    todos: [],
    error: false,
  });
  // const state = {
  //   olderTodosAvailable: true,
  //   newTodosCount: 1,
  //   todos: [
  //     {
  //       id: "1",
  //       title: "This is public todo 1",
  //       user: {
  //         name: "someUser1",
  //       },
  //     },
  //     {
  //       id: "2",
  //       title: "This is public todo 2",
  //       is_completed: false,
  //       is_public: true,
  //       user: {
  //         name: "someUser2",
  //       },
  //     },
  //     {
  //       id: "3",
  //       title: "This is public todo 3",
  //       user: {
  //         name: "someUser3",
  //       },
  //     },
  //     {
  //       id: "4",
  //       title: "This is public todo 4",
  //       user: {
  //         name: "someUser4",
  //       },
  //     },
  //   ],
  // };
  let numTodos = state.todos.length;
  let oldestTodoId = numTodos
    ? state.todos[numTodos - 1].id
    : latestTodo
    ? latestTodo.id + 1
    : 0;
  let newestTodoId = numTodos
    ? state.todos[0].id
    : latestTodo
    ? latestTodo.id
    : 0;
  const client = useApolloClient();

  useEffect(() => {
    loadOlder();
  }, []);
  useEffect(() => {
    if (latestTodo && latestTodo.id > newestTodoId) {
      setState((prevState) => {
        return { ...prevState, newTodosCount: prevState.newTodosCount + 1 };
      });
      newestTodoId = latestTodo.id;
    }
  }, [latestTodo]);
  const loadNew = async () => {
    const GET_NEW_PUBLIC_TODOS = gql`
      query getNewPublicTodos($latestVisibleId: Int!) {
        todos(
          where: { is_public: { _eq: true }, id: { _gt: $latestVisibleId } }
          order_by: { created_at: desc }
        ) {
          id
          title
          created_at
          user {
            name
          }
        }
      }
    `;
    const { error, data } = await client.query({
      query: GET_NEW_PUBLIC_TODOS,
      variables: {
        latestVisibleId: state.todos.length ? state.todos[0].id : null,
      },
    });

    if (data) {
      setState((prevState) => {
        return {
          ...prevState,
          todos: [...data.todos, ...prevState.todos],
          newTodosCount: 0,
        };
      });
      newestTodoId = data.todos[0].id;
    }
    if (error) {
      console.error(error);
      setState((prevState) => {
        return { ...prevState, error: true };
      });
    }
  };

  const loadOlder = async () => {
    const GET_OLD_PUBLIC_TODOS = gql`
      query getOldPublicTodos($oldestTodoId: Int!) {
        todos(
          where: { is_public: { _eq: true }, id: { _lt: $oldestTodoId } }
          limit: 7
          order_by: { created_at: desc }
        ) {
          id
          title
          created_at
          user {
            name
          }
        }
      }
    `;

    const { error, data } = await client.query({
      query: GET_OLD_PUBLIC_TODOS,
      variables: { oldestTodoId: oldestTodoId },
    });

    if (data.todos.length) {
      setState((prevState) => {
        return { ...prevState, todos: [...prevState.todos, ...data.todos] };
      });
      oldestTodoId = data.todos[data.todos.length - 1].id;
    } else {
      setState((prevState) => {
        return { ...prevState, olderTodosAvailable: false };
      });
    }
    if (error) {
      console.error(error);
      setState((prevState) => {
        return { ...prevState, error: true };
      });
    }
  };

  let todos = state.todos;

  const todoList = (
    <ul>
      {todos.map((todo, index) => {
        return <TaskItem key={index} index={index} todo={todo} />;
      })}
    </ul>
  );

  let newTodosNotification = "";
  if (state.newTodosCount) {
    newTodosNotification = (
      <div className={"loadMoreSection"} onClick={loadNew}>
        New tasks have arrived! ({state.newTodosCount.toString()})
      </div>
    );
  }

  const olderTodosMsg = (
    <div className={"loadMoreSection"} onClick={loadOlder}>
      {state.olderTodosAvailable ? "Load older tasks" : "No more public tasks!"}
    </div>
  );

  return (
    <Fragment>
      <div className="todoListWrapper">
        {newTodosNotification}

        {todoList}

        {olderTodosMsg}
      </div>
    </Fragment>
  );
};

const NOTIFY_NEW_PUBLIC_TODOS = gql`
  subscription notifyNewPublicTodos {
    todos(
      where: { is_public: { _eq: true } }
      limit: 1
      order_by: { created_at: desc }
    ) {
      id
      created_at
    }
  }
`;

const todoPublicListSubscription = () => {
  const { loading, error, data } = useSubscription(NOTIFY_NEW_PUBLIC_TODOS);
  if (loading) return <span>loading</span>;
  if (error) return <span>{error.message}</span>;
  return (
    <TodoPublicList latestTodo={data.todos.length ? data.todos[0] : null} />
  );
};

export default todoPublicListSubscription;
