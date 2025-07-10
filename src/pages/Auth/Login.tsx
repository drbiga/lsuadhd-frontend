import { Button } from "@/components/common/Button";
import { DarkModeButton } from "@/components/common/DarkModeButton";
import { useAuth } from "@/hooks/auth";
import { useCallback, useEffect } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const {
    reset,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { login, authState } = useAuth();

  useEffect(() => {
    if (authState.isLoggedIn) {
      navigate('/')
    }
  }, [authState])

  const onSubmit = useCallback(async (data: FieldValues) => {
  try {
    const session = await login({ username: data.username, password: data.password });
    if (session) {
      navigate('/');
    }
  } catch (error) {
    toast.error('Login failed. Please check your credentials.');
    reset();
  }
}, [login, navigate, reset]);

  return (
    <div
      className="h-[100vh] w-[100vw] bg-background flex flex-col items-center justify-center relative"
    >
      <img className="bg-background" src="meta-symbol.png" width="200px" alt="" />
      <div className="bg-primary-foreground border-[1px] border-slate-500 dark:border-slate-300 rounded-lg p-4 text-slate-200 flex flex-col gap-4">
        <h1 className="text-xl text-slate-800 dark:text-slate-200">Log In</h1>
        <div>
          <form className="flex flex-col gap-4 p-2" onSubmit={handleSubmit(onSubmit)}>
            <fieldset className="flex flex-col gap-2 relative group">
              <label htmlFor="name" className="z-1 text-slate-400 text-sm absolute top-1 left-2 transition-all duration-100 group-focus:top-[-1.25rem] group-hover:top-[-1.25rem]">Name</label>
              <input
                id="name"
                className="z-10 w-[250px] px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 focus:bg-primary dark:focus:bg-slate-700 text-slate-700 dark:text-slate-300"
                type="text"
                placeholder="Name..."
                {...register("username", { required: true })}
              />
              {errors.email && (
                <p className="text-red-600">Name required</p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2 relative group">
              <label htmlFor="password" className="z-1 text-slate-400 text-sm absolute top-1 left-2 transition-all duration-100 group-focus-within:top-[-1.25rem] group-hover:top-[-1.25rem]">Password</label>
              <input
                id="password"
                className="z-10 w-[250px] px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 focus:bg-primary dark:focus:bg-slate-700 text-slate-700 dark:text-slate-300"
                type="password"
                placeholder="Password..."
                {...register("password", { required: true })}
              />
              {errors.password && (
                <p className="text-red-600">Password is required</p>
              )}
            </fieldset>

            <div className="flex justify-around">
              <DarkModeButton />
              <Button>
                <Link className="" to='/signup'>Sign Up</Link>
              </Button>
              <Button type="submit">Log In</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}