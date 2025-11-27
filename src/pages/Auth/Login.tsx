import { Button } from "@/components/ui/button"
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
      navigate('/lsuadhd-frontend/')
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
    <div className="h-[100vh] w-[100vw] bg-background flex items-center justify-center">
      <div className="absolute top-6 right-6">
        <DarkModeButton />
      </div>
      
      <div className="w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                type="text"
                placeholder="Enter your name"
                {...register("username", { required: true })}
              />
              {errors.email && (
                <p className="text-destructive text-sm">Name is required</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                type="password"
                placeholder="Enter your password"
                {...register("password", { required: true })}
              />
              {errors.password && (
                <p className="text-destructive text-sm">Password is required</p>
              )}
            </div>

            <Button className="w-full mt-2" type="submit">
              Log In
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to='/signup' className="text-accent hover:text-accent/90 font-medium transition-colors">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}