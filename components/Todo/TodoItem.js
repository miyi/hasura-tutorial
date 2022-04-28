import React from "react";
import { gql, useMutation } from "@apollo/client";
import { GET_MY_TODOS } from "./TodoPrivateList";

const TodoItem = ({ index, todo }) => {
  const REMOVE_TODO = gql`
    mutation removeTodo($id: Int!) {
      delete_todos(where: { id: { _eq: $id } }) {
        affected_rows
        returning {
          id
        }
      }
    }
  `;

  const TOGGLE_TODO = gql`
    mutation toggleTodo($id: Int!, $isCompleted: Boolean!) {
      update_todos(
        where: { id: { _eq: $id } }
        _set: { is_completed: $isCompleted }
      ) {
        affected_rows
        returning {
          id
          title
          is_completed
        }
      }
    }
  `;

  const [toggleTodoMutation] = useMutation(TOGGLE_TODO);
  const [removeTodoMutation] = useMutation(REMOVE_TODO, {
    update(cache, { data }) {
      const existingTodos = cache.readQuery({ query: GET_MY_TODOS });
      const newTodos = existingTodos.todos.map((t) => {
        if (t.id === todo.id) {
          return { ...t, ...data.update_todos.returning[0] };
        } else {
          return t;
        }
      });
      cache.writeQuery({
        query: GET_MY_TODOS,
        data: { todos: newTodos },
      });
    },
  });

  const toggleTodo = () => {
    toggleTodoMutation({
      variables: { id: todo.id, isCompleted: !todo.is_completed },
      optimisticResponse: {
        __typename: "mutation_root",
        update_todos: {
          __typename: "todos_mutation_response",
          affected_rows: 1,
          returning: [
            {
              __typename: "todos",
              id: todo.id,
              title: todo.title,
              is_completed: !todo.is_completed,
            },
          ],
        },
      },
    });
  };

  const removeTodo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeTodoMutation({
      variables: { id: todo.id },
      optimisticResponse: {
        __typename: "mutation_root",
        delete_todos: {
          __typename: "todos_mutation_response",
          affected_rows: 1,
          returning: [
            {
              __typename: "todos",
              id: todo.id,
            },
          ],
        },
      },
      update: (cache) => {
        const existingTodos = cache.readQuery({ query: GET_MY_TODOS });
        const newTodos = existingTodos.todos.filter((t) => t.id !== todo.id);
        console.log(newTodos);
        cache.writeQuery({
          query: GET_MY_TODOS,
          data: { todos: newTodos },
        });
      },
    });
  };

  return (
    <li>
      <div className="view">
        <div className="round">
          <input
            checked={todo.is_completed}
            type="checkbox"
            id={todo.id}
            onChange={toggleTodo}
          />
          <label htmlFor={todo.id} />
        </div>
      </div>

      <div className={"labelContent" + (todo.is_completed ? " completed" : "")}>
        <div>{todo.title}</div>
      </div>

      <button className="closeBtn" onClick={removeTodo}>
        x
      </button>
    </li>
  );
};

export default TodoItem;
