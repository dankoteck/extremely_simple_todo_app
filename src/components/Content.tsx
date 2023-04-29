import { UserButton } from "@clerk/nextjs";
import { type Todo } from "@prisma/client";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { api } from "~/utils/api";

export default function Content() {
  const [title, setTitle] = useState("");
  const { data: todos } = api.todo.all.useQuery();
  const utils = api.useContext();

  const addMutation = api.todo.add.useMutation({
    async onMutate(newTodo) {
      await utils.todo.all.cancel();

      const prevData = utils.todo.all.getData() ?? [];

      utils.todo.all.setData(undefined, (old) =>
        old ? [...old, { title: newTodo, id: `${Math.random()}` } as Todo] : []
      );

      return { prevData };
    },
    onError(err, newPost, ctx) {
      utils.todo.all.setData(undefined, ctx?.prevData);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    },
    async onSettled() {
      await utils.todo.all.invalidate();
    },
  });

  const toggleCompletedMutation = api.todo.toggleCompleted.useMutation({
    async onMutate({ id, completed }) {
      await utils.todo.all.cancel();

      const prevData = utils.todo.all.getData() ?? [];

      utils.todo.all.setData(undefined, (old) => {
        const newData = old ? [...old] : [];
        const index = newData.findIndex((item) => item.id === id);

        if (index > -1) {
          newData[index]!.completed = completed;
        }

        return newData;
      });

      return { prevData };
    },
    onError(err, newPost, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.todo.all.setData(undefined, ctx?.prevData);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.todo.all.invalidate();
    },
  });

  const deleteMutation = api.todo.delete.useMutation({
    async onMutate(id: string) {
      await utils.todo.all.cancel();

      const prevData = utils.todo.all.getData() ?? [];

      utils.todo.all.setData(undefined, (old) =>
        old ? old.filter((item) => item.id !== id) : []
      );

      return { prevData };
    },
    onError(err, newPost, ctx) {
      // If the mutation fails, use the context-value from onMutate
      utils.todo.all.setData(undefined, ctx?.prevData);
      toast.error(err.message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    },
    async onSettled() {
      // Sync with server once mutation has settled
      await utils.todo.all.invalidate();
    },
  });

  const handleAdd = () => {
    setTitle("");
    addMutation.mutate(title);
  };

  const handleToggleCompleted = (id: string, completed: boolean) => {
    toggleCompletedMutation.mutate({ id, completed });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="grid w-[1280px] grid-cols-12 gap-4 px-8">
      <div className="col-span-3 flex h-screen justify-end border-r border-white p-8 text-white">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "w-16 h-16",
            },
          }}
        />
      </div>

      <div className="col-span-6 h-screen py-8 text-white">
        <form onSubmit={(evt) => evt.preventDefault()}>
          <label
            htmlFor="default-search"
            className="sr-only mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Search
          </label>
          <div className="relative">
            <input
              type="search"
              id="default-search"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              placeholder="Add new todo here..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              disabled={!title}
              onClick={handleAdd}
              className={`absolute bottom-2.5 right-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${
                title ? "" : "cursor-not-allowed"
              }`}
            >
              Add
            </button>
          </div>
        </form>

        <ul className="my-8 space-y-4 text-left text-gray-500 dark:text-gray-400">
          {todos?.map((item) => (
            <li key={item.id} className="flex justify-between">
              <div
                className={`stroke flex flex-col gap-2 ${
                  item.completed ? "line-through decoration-4" : ""
                }`}
              >
                {item.title}
              </div>
              <div>
                <button
                  onClick={() =>
                    handleToggleCompleted(item.id, !item.completed)
                  }
                  className={`rounded-lg bg-blue-700 px-3 py-2 text-center text-xs font-medium text-white  hover:bg-blue-800 ${
                    item.completed
                      ? "!bg-slate-500 !text-black  hover:!bg-slate-600"
                      : ""
                  }`}
                >
                  {item.completed ? "Mark as undone" : "Mark as done"}
                </button>{" "}
                <button
                  onClick={() => handleDelete(item.id)}
                  type="button"
                  className="mb-2 mr-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-span-3 h-screen border-l border-white text-white"></div>

      <ToastContainer />
    </div>
  );
}
