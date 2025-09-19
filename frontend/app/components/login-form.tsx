import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { use, useState } from "react"
import type { LoginRequest } from "~/types"
import { toast } from 'sonner'
import { useAuthStore } from "~/stores/auth"
import { authAPI } from "~/services/api"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, set_username] = useState('');
  const [password, set_password] = useState('');
  const [isLoading, set_Loading] = useState(false);
  const navigate=useNavigate();
  const {login}=useAuthStore();

   const onSubmitHandler = async (e) => {
  e.preventDefault(); // ✅ fixed typo + added parentheses
  set_Loading(true);

  const data: LoginRequest = {
    username: username,
    password: password,
  };

  try {
    const response = await authAPI.login(data);

    // alert(response.user.role);
    login(response.user, response.token);
    toast.success(`Welcome back, ${response.user.firstName}!`);

    // Redirect based on role
    switch (response.user.role) {
      case "waiter":
        navigate("/waiter");
        break;
      case "chef":
        navigate("/chef");
        break;
      case "admin":
        navigate("/admin");
        break;
      default:
        navigate("/waiter");
    }
  } catch (error: any) {
    alert("error");
    console.log(error);
    toast.error(error.response?.data?.error || "Login failed");
  } finally {
    set_Loading(false);
  }
};

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to Dashboard</CardTitle>
          <CardDescription>
            Enter Username and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitHandler}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="enter username"
                  onChange={(e)=>{set_username(e.target.value)}}
                  value={username}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Input id="password" type="password" required placeholder="Password"
                onChange={(e)=>{set_password(e.target.value)}}
                value={password} 
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}
                >
                  {isLoading ? 'Log in...' : 'LogIn'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
