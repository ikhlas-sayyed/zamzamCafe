import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { useNavigate as useNavigate$1 } from "react-router-dom";
import * as LabelPrimitive from "@radix-ui/react-label";
import { toast } from "sonner";
import axios from "axios";
import { io } from "socket.io-client";
import { ArrowLeft, MapPin, Minus, Plus, XCircle, CheckCircle, Eye, ChefHat, Clock, Filter, Package, Users, UserCheck, ChevronUp, ChevronDown, AlertTriangle, Timer, ChevronDownIcon, CheckIcon, ChevronUpIcon, XIcon, LayoutList, ShoppingCart, PlusCircle, FileText, Printer, Trash2, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import * as SelectPrimitive from "@radix-ui/react-select";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true
        });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      },
      updateUser: (user) => {
        set({ user });
        localStorage.setItem("user", JSON.stringify(user));
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
function meta({}) {
  return [{
    title: "New React Router App"
  }, {
    name: "description",
    content: "Welcome to React Router!"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  const {
    isAuthenticated,
    user
  } = useAuthStore();
  const navigate = useNavigate();
  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return "/login";
    switch (user.role) {
      case "waiter":
        return "/waiter";
      case "chef":
        return "/chef";
      case "admin":
        return "/admin";
      default:
        return "/login";
    }
  };
  useEffect(() => {
    let path = getDefaultRoute();
    navigate(path);
  }, [isAuthenticated, user, getDefaultRoute, navigate]);
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
const API_BASE_URL = "https://api.insightnest.tech/";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    var _a;
    if (typeof window !== "undefined" && ((_a = error.response) == null ? void 0 : _a.status) === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
const authAPI = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    console.log(response.data);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data.data;
  },
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data.data;
  }
};
const menuAPI = {
  getAll: async () => {
    const response = await api.get("/menu/");
    return response.data.data;
  },
  getAdmin: async () => {
    const response = await api.get("/menu/admin");
    return response.data.data;
  },
  getById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data.data;
  },
  create: async (menuItem) => {
    const response = await api.post("/menu", menuItem, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.data;
  },
  update: async (id, menuItem) => {
    const response = await api.put(`/menu/${id}`, menuItem, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data.data;
  },
  delete: async (id) => {
    await api.delete(`/menu/${id}`);
  },
  toggleAvailability: async (id) => {
    const response = await api.patch(`/menu/${id}/toggle`);
    return response.data.data;
  }
};
const ordersAPI = {
  getAll: async (params) => {
    const response = await api.get("/orders", { params });
    console.log(response.data.data);
    return {
      data: response.data.data,
      pagination: response.data.pagination
    };
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },
  getBill: async (id) => {
    const response = await api.get(`/orders/${id}/bill`);
    console.log(response.data.data);
    return response.data.data;
  },
  create: async (order) => {
    const response = await api.post("/orders", order);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data.data;
  },
  updateItemStatus: async (id, itemIndex, status, chefRemarks) => {
    const response = await api.patch(`/orders/${id}/items/${itemIndex}/status`, {
      status,
      chefRemarks
    });
    return response.data.data;
  },
  updateItems: async (id, items) => {
    const response = await api.patch(`/orders/${id}/items/update`, {
      updates: items
    });
    return response.data.data;
  },
  addItem: async (id, items) => {
    let a = [items];
    const response = await api.patch(`/orders/${id}/additems`, {
      items: a
    });
    return response.data.data;
  },
  addChefRemarks: async (id, chefRemarks) => {
    const response = await api.patch(`/orders/${id}/remarks`, { chefRemarks });
    return response.data.data;
  },
  // Orders API - add this function
  getOrdersByDate: async (startDate, endDate, status) => {
    const params = { startDate, endDate };
    if (status) params.status = status;
    const response = await api.get("/orders/by-date", { params });
    return response.data.data;
  },
  createPayment: async (id, paymentData) => {
    const response = await api.post(`/orders/${id}/payment`, paymentData);
    return response.data.data;
  },
  submitCash: async (orderId) => {
    const response = await api.patch(`/orders/${orderId}/submitCash`, {});
    return response.data.data;
  },
  getCashCollections: async (params) => {
    const response = await api.get("/orders/payments/cash-collections", { params });
    return response.data.data;
  },
  updatePayment: async (paymentId, paymentData) => {
    const response = await api.put(`/orders/payments/${paymentId}`, paymentData);
    return response.data.data;
  },
  delete: async (id) => {
    await api.delete(`/orders/${id}`);
  }
};
const insightsAPI = {
  // Existing sales insights (if needed)
  getSalesInsights: async (startDate, endDate) => {
    const response = await api.get("/orders/insights/sales", {
      params: { startDate, endDate }
    });
    return response.data.data;
  },
  // New: full restaurant insights
  getFullInsights: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get("/orders/insights", { params });
    return response.data.data;
  }
};
function LoginForm({
  className,
  ...props
}) {
  const [username, set_username] = useState("");
  const [password, set_password] = useState("");
  const [isLoading, set_Loading] = useState(false);
  const navigate = useNavigate$1();
  const { login: login2 } = useAuthStore();
  const onSubmitHandler = async (e) => {
    var _a, _b;
    e.preventDefault();
    set_Loading(true);
    const data = {
      username,
      password
    };
    try {
      const response = await authAPI.login(data);
      alert(response.user.role);
      login2(response.user, response.token);
      toast.success(`Welcome back, ${response.user.firstName}!`);
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
    } catch (error) {
      alert("error");
      console.log(error);
      toast.error(((_b = (_a = error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Login failed");
    } finally {
      set_Loading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: cn("flex flex-col gap-6", className), ...props, children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardTitle, { children: "Login to Dashboard" }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Enter Username and password" })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("form", { onSubmit: onSubmitHandler, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "username", children: "Username" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "username",
            type: "text",
            placeholder: "enter username",
            onChange: (e) => {
              set_username(e.target.value);
            },
            value: username,
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: /* @__PURE__ */ jsx(
        Input,
        {
          id: "password",
          type: "password",
          required: true,
          placeholder: "Password",
          onChange: (e) => {
            set_password(e.target.value);
          },
          value: password
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full",
          disabled: isLoading,
          children: isLoading ? "Log in..." : "LogIn"
        }
      ) })
    ] }) }) })
  ] }) });
}
const login = UNSAFE_withComponentProps(function Page() {
  return /* @__PURE__ */ jsx("div", {
    className: "flex min-h-svh w-full items-center justify-center p-6 md:p-10",
    children: /* @__PURE__ */ jsx("div", {
      className: "w-full max-w-sm",
      children: /* @__PURE__ */ jsx(LoginForm, {})
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
const MenuItems = ({ item, additems }) => /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow", children: [
  /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-full h-32 object-cover" }),
  /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
      /* @__PURE__ */ jsx("h4", { className: "font-semibold text-sm text-gray-800", children: item.name }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded", children: [
        "ID: ",
        item.id
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("span", { className: "font-bold text-blue-600", children: [
        "₹",
        item.price
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => additems(item.id, 1, item.name, item.price, item.image),
          className: "bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors",
          children: "Add"
        }
      )
    ] })
  ] })
] });
const Header$2 = ({ currentPage = "", navigate }) => /* @__PURE__ */ jsx("header", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
  /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Cafe Zam Zam" }),
    /* @__PURE__ */ jsx("p", { className: "text-blue-100 text-sm", children: "Waiter Interface" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/waiter/orders"),
        className: `backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${currentPage === "orders" ? "bg-white/30" : "bg-white/20 hover:bg-white/30"}`,
        children: /* @__PURE__ */ jsx("span", { children: "Orders" })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/waiter"),
        className: `rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${currentPage === "new-order" ? "bg-green-600" : "bg-green-500 hover:bg-green-600"}`,
        children: /* @__PURE__ */ jsx("span", { children: "New Order" })
      }
    )
  ] })
] }) }) });
const CurrentOrderItem = ({ item, onRemove, index: number }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [
  /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
    /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-12 h-12 object-cover rounded" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { className: "font-semibold", children: item.name }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
        "₹",
        item.price,
        " x ",
        item.quantity
      ] })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
    /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
      "₹",
      item.price * item.quantity
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onRemove(index),
        className: "text-red-500 hover:text-red-700"
      }
    )
  ] })
] });
function useToasts$3() {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{
      id,
      message
    }, ...t]);
    setTimeout(() => remove(id), 4e3);
  }, [remove]);
  return {
    toasts,
    push,
    remove
  };
}
function Toasts$2({
  toasts,
  onClose
}) {
  return /* @__PURE__ */ jsx("div", {
    className: "fixed top-4 right-4 z-[9999] space-y-2 w-[90vw] max-w-sm",
    children: toasts.map((t) => /* @__PURE__ */ jsx("div", {
      className: "bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700/50 cursor-pointer",
      onClick: () => onClose(t.id),
      role: "status",
      "aria-live": "polite",
      children: t.message
    }, t.id))
  });
}
const Menu$1 = () => {
  const [menu2, setMenu] = useState([]);
  const [waiterId, setWaiterId] = useState();
  const [selected, setSelected] = useState({});
  const [tableNumber, setTableNumber] = useState();
  const [inputMethod, setInputMethod] = useState("menu");
  const [current_itemId, setCurrentItemId] = useState();
  const [itemQuantity, setItemQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const socketRef = useRef(null);
  const SOCKET_URL2 = api.defaults.baseURL || "http://localhost:3000";
  const {
    toasts,
    push,
    remove
  } = useToasts$3();
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAll();
        setMenu(data);
        const user = JSON.parse(localStorage.getItem("user"));
        setWaiterId(user.id);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    };
    fetchMenu();
  }, []);
  useEffect(() => {
    if (waiterId !== void 0) {
      console.log(waiterId);
    }
  }, [waiterId]);
  useEffect(() => {
    const s = io(SOCKET_URL2, {
      transports: ["websocket"]
    });
    socketRef.current = s;
    s.on("OrderStatus", (payload) => {
      if (payload.waiterId === waiterId) {
        push(`Order #${payload.orderNumber} is ${payload.status}`);
      }
    });
    s.on("ItemStatus", (payload) => {
      if (payload.waiterId === waiterId) {
        push(`Order #${payload.orderNumber} - ${payload.name} is ${payload.status}`);
      }
    });
    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL2, waiterId, push]);
  const addOrderItem = useCallback((itemId, itemQty, name, price, image) => {
    setOrderItems((prevItems) => {
      const index2 = prevItems.findIndex((item) => item.menuItemId === itemId);
      if (index2 !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[index2] = {
          ...updatedItems[index2],
          quantity: updatedItems[index2].quantity + itemQty
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          menuItemId: itemId,
          quantity: itemQty,
          name,
          price,
          image
        }];
      }
    });
  }, []);
  const previewItem = useMemo(() => {
    if (!current_itemId) return null;
    return menu2.find((obj) => obj.id === Number(current_itemId)) ?? null;
  }, [menu2, current_itemId]);
  const currentOrderTotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0), [orderItems]);
  const itemchng = (itemId) => {
    setCurrentItemId(Number(itemId));
  };
  const addItemById = () => {
    if (previewItem) {
      addOrderItem(previewItem.id, itemQuantity, previewItem.name, previewItem.price, previewItem.image);
    }
  };
  const removeFromCurrentOrder = (i) => {
    setOrderItems((items) => items.filter((_, index2) => index2 !== i));
  };
  const clearOrder = () => {
    setOrderItems([]);
  };
  const placeOrder = async () => {
    setPlacing(true);
    console.log(orderItems);
    try {
      await ordersAPI.create({
        items: orderItems,
        tableNumber,
        notes: ""
      });
      clearOrder();
      push("Order placed!");
    } catch (error) {
      console.error("Failed to place order:", error);
      push("Error placing order");
    } finally {
      setPlacing(false);
    }
  };
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Header$2, {
      navigate
    }), /* @__PURE__ */ jsx(Toasts$2, {
      toasts,
      onClose: remove
    }), /* @__PURE__ */ jsx("div", {
      className: "container mx-auto px-4 py-6",
      children: /* @__PURE__ */ jsxs("div", {
        className: "bg-white rounded-2xl shadow-lg p-6 mb-6",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xl font-bold text-gray-800 mb-4",
          children: "Create New Order"
        }), /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
          children: /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-2",
              children: "Table Number"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: tableNumber ?? "",
              onChange: (e) => setTableNumber(parseInt(e.target.value)),
              className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: "Table #"
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex space-x-4 mb-6",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => setInputMethod("menu"),
            className: `px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "menu" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
            children: "Menu Selection"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setInputMethod("id"),
            className: `px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "id" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
            children: "ID Entry"
          })]
        }), inputMethod === "id" && /* @__PURE__ */ jsxs("div", {
          className: "bg-gray-50 rounded-lg p-6 mb-6",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-lg font-semibold text-gray-800 mb-4",
            children: "Enter Item by ID"
          }), /* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-1 md:grid-cols-3 gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Item ID"
              }), /* @__PURE__ */ jsx("input", {
                type: "number",
                value: current_itemId ?? "",
                onChange: (e) => itemchng(e.target.value),
                className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                placeholder: "Enter ID (1-12)"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Quantity"
              }), /* @__PURE__ */ jsx("input", {
                type: "number",
                min: "1",
                value: itemQuantity,
                onChange: (e) => setItemQuantity(parseInt(e.target.value) || 1),
                className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "flex items-end",
              children: /* @__PURE__ */ jsx("button", {
                onClick: addItemById,
                className: "w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors",
                children: "Add Item"
              })
            })]
          }), previewItem && /* @__PURE__ */ jsx("div", {
            className: "mt-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "bg-white border rounded-lg p-3 flex items-center space-x-3",
              children: [/* @__PURE__ */ jsx("img", {
                src: previewItem.image,
                alt: previewItem.name,
                className: "w-16 h-16 object-cover rounded"
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "font-semibold",
                  children: previewItem.name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-blue-600 font-bold",
                  children: ["₹", previewItem.price]
                })]
              })]
            })
          })]
        }), orderItems.length > 0 && /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-2xl shadow-lg p-6 mb-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex justify-between items-center mb-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-xl font-bold text-gray-800",
              children: "Current Order"
            }), /* @__PURE__ */ jsx("button", {
              onClick: clearOrder,
              className: "text-red-500 hover:text-red-700 font-medium",
              children: "Clear All"
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-3",
            children: orderItems.map((item, index2) => /* @__PURE__ */ jsx(CurrentOrderItem, {
              item,
              index: index2,
              onRemove: removeFromCurrentOrder
            }, item.menuItemId))
          }), /* @__PURE__ */ jsxs("div", {
            className: "border-t pt-4 mt-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center text-xl font-bold",
              children: [/* @__PURE__ */ jsx("span", {
                children: "Total"
              }), /* @__PURE__ */ jsxs("span", {
                children: ["₹", currentOrderTotal]
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: placeOrder,
              disabled: placing,
              className: "w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors",
              children: "Submit Order"
            })]
          })]
        }), inputMethod === "menu" && /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6",
          children: menu2.map((item) => /* @__PURE__ */ jsx(MenuItems, {
            item,
            additems: addOrderItem
          }, item.id))
        })]
      })
    })]
  });
};
const menu$2 = UNSAFE_withComponentProps(Menu$1);
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: menu$2
}, Symbol.toStringTag, { value: "Module" }));
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}
function useToasts$2() {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{
      id,
      message
    }, ...t]);
    setTimeout(() => remove(id), 4e3);
  }, [remove]);
  return {
    toasts,
    push,
    remove
  };
}
function Toasts$1({
  toasts,
  onClose
}) {
  return /* @__PURE__ */ jsx("div", {
    className: "fixed top-4 right-4 z-[9999] space-y-2 w-[90vw] max-w-sm",
    children: toasts.map((t) => /* @__PURE__ */ jsx("div", {
      className: "bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700/50 cursor-pointer",
      onClick: () => onClose(t.id),
      role: "status",
      "aria-live": "polite",
      children: t.message
    }, t.id))
  });
}
function Header2({
  activeOrders = 0
}) {
  return /* @__PURE__ */ jsx("header", {
    className: "bg-white border-b shadow-sm",
    children: /* @__PURE__ */ jsx("div", {
      className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
      children: /* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center h-16",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-xl font-bold text-gray-900",
          children: "Restaurant Manager"
        }), /* @__PURE__ */ jsxs(Badge, {
          variant: "secondary",
          className: "bg-green-100 text-green-800",
          children: [activeOrders, " Active Orders"]
        })]
      })
    })
  });
}
function StatusBadge({
  status
}) {
  const config = useMemo(() => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock
      },
      preparing: {
        color: "bg-blue-100 text-blue-800",
        icon: ChefHat
      },
      ready: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle
      }
    };
    return statusConfig[status] ?? statusConfig.pending;
  }, [status]);
  const Icon = config.icon;
  return /* @__PURE__ */ jsxs(Badge, {
    className: `${config.color} flex items-center gap-1 px-3 py-1`,
    children: [/* @__PURE__ */ jsx(Icon, {
      className: "w-3 h-3"
    }), /* @__PURE__ */ jsx("span", {
      className: "capitalize font-medium",
      children: status
    })]
  });
}
function OrdersPage({
  onViewOrder,
  orders: orders2,
  setIndex,
  setOrderId,
  updateOrder
}) {
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header2, {
      activeOrders: orders2.length
    }), /* @__PURE__ */ jsxs("div", {
      className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-3xl font-bold text-gray-900 mb-2",
          children: "Order Management"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600",
          children: "Manage and track all restaurant orders"
        })]
      }), orders2.length > 0 ? /* @__PURE__ */ jsx("div", {
        className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
        children: orders2.map((order, index2) => /* @__PURE__ */ jsxs(Card, {
          className: "hover:shadow-lg transition-shadow duration-300 border-0 shadow-md",
          children: [/* @__PURE__ */ jsx(CardHeader, {
            className: "pb-3",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-start",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsxs(CardTitle, {
                  className: "text-lg font-bold text-gray-900",
                  children: ["Order #", order.orderNumber]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-2 mt-2 text-sm text-gray-500",
                  children: [/* @__PURE__ */ jsx(MapPin, {
                    className: "w-4 h-4"
                  }), /* @__PURE__ */ jsxs("span", {
                    children: ["Table ", order.tableNumber]
                  })]
                })]
              }), /* @__PURE__ */ jsx(StatusBadge, {
                status: order.status
              })]
            })
          }), /* @__PURE__ */ jsxs(CardContent, {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center py-3 border-t border-gray-100",
              children: [/* @__PURE__ */ jsxs("p", {
                className: "text-2xl font-bold text-gray-900",
                children: ["₹", order.totalAmount]
              }), /* @__PURE__ */ jsxs("p", {
                className: "text-sm text-gray-500",
                children: [order.items.length, " items"]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2",
              children: [/* @__PURE__ */ jsxs(Button, {
                variant: "outline",
                disabled: order.status === "cancelled" || order.status === "completed",
                onClick: () => {
                  updateOrder(order.id, "cancelled");
                },
                size: "sm",
                className: "flex-1 text-red-600 border-red-200 hover:bg-red-50",
                children: [/* @__PURE__ */ jsx(XCircle, {
                  className: "w-4 h-4 mr-2"
                }), " Cancel"]
              }), /* @__PURE__ */ jsxs(Button, {
                variant: "outline",
                disabled: order.status === "cancelled" || order.status === "completed",
                size: "sm",
                onClick: () => {
                  updateOrder(order.id, "completed");
                },
                className: "flex-1 text-green-600 border-green-200 hover:bg-green-50",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "w-4 h-4 mr-2"
                }), " Complete"]
              }), /* @__PURE__ */ jsxs(Button, {
                variant: "default",
                size: "sm",
                className: "flex-1 bg-blue-600 hover:bg-blue-700",
                onClick: () => {
                  onViewOrder(order);
                  setIndex(index2);
                  setOrderId(order.id);
                },
                children: [/* @__PURE__ */ jsx(Eye, {
                  className: "w-4 h-4 mr-2"
                }), " View"]
              })]
            })]
          })]
        }, order.id))
      }) : /* @__PURE__ */ jsxs("div", {
        className: "text-center py-12",
        children: [/* @__PURE__ */ jsx(ChefHat, {
          className: "w-16 h-16 text-gray-300 mx-auto mb-4"
        }), /* @__PURE__ */ jsx("h3", {
          className: "text-lg font-medium text-gray-900 mb-2",
          children: "No orders yet"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-500",
          children: "Orders will appear here when customers place them."
        })]
      })]
    })]
  });
}
const AddItemToOrderModal = ({
  orderId,
  isOpen,
  onClose,
  onAdded
}) => {
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!isOpen) {
      setItemId("");
      setQuantity(1);
      setPreview(null);
      setError(null);
      setLoadingPreview(false);
      setAdding(false);
    }
  }, [isOpen]);
  const fetchPreview = async () => {
    setError(null);
    if (!itemId) {
      setError("Please enter an item id");
      return;
    }
    setLoadingPreview(true);
    try {
      let found = null;
      if (typeof menuAPI.getById === "function") {
        try {
          found = await menuAPI.getById(itemId);
        } catch (err) {
          found = null;
        }
      }
      if (!found) {
        const list = await menuAPI.getAll();
        found = list.find((m) => String(m.id) === String(itemId) || String(m._id) === String(itemId));
      }
      if (found) {
        setPreview(found);
      } else {
        setPreview(null);
        setError("Item not found in menu.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch item preview.");
    } finally {
      setLoadingPreview(false);
    }
  };
  const handleAdd = async () => {
    setError(null);
    if (!itemId) {
      setError("Enter item id.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    setAdding(true);
    try {
      const payload = preview ? {
        ...preview,
        quantity
      } : {
        id: Number(itemId),
        menuItemId: itemId,
        quantity
      };
      console.log(payload);
      await ordersAPI.addItem(orderId, payload);
      if (onAdded) onAdded(payload);
      setItemId("");
      setQuantity(1);
      setPreview(null);
      onClose();
    } catch (err) {
      console.error("Failed to add item to order", err);
      setError("Failed to add item to order.");
    } finally {
      setAdding(false);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4",
    children: /* @__PURE__ */ jsx(Card, {
      className: "max-w-lg w-full",
      children: /* @__PURE__ */ jsxs(CardContent, {
        className: "p-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex justify-between items-center mb-4",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-lg font-semibold",
            children: "Add Item to Order"
          }), /* @__PURE__ */ jsx("button", {
            onClick: onClose,
            className: "text-gray-500 hover:text-gray-700",
            children: "Close"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 gap-4",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Order ID"
            }), /* @__PURE__ */ jsx("input", {
              readOnly: true,
              value: orderId,
              className: "w-full p-3 border rounded bg-gray-100"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Item ID"
            }), /* @__PURE__ */ jsx("input", {
              value: itemId,
              onChange: (e) => setItemId(e.target.value),
              placeholder: "Enter item ID"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-1",
              children: "Quantity"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              min: 1,
              value: quantity,
              onChange: (e) => setQuantity(Number(e.target.value) || 1)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex space-x-2",
            children: [/* @__PURE__ */ jsx(Button, {
              onClick: fetchPreview,
              disabled: loadingPreview,
              children: loadingPreview ? "Loading..." : "Preview"
            }), /* @__PURE__ */ jsx(Button, {
              onClick: handleAdd,
              disabled: adding,
              children: adding ? "Adding..." : "Add to order"
            }), /* @__PURE__ */ jsx(Button, {
              onClick: onClose,
              variant: "ghost",
              children: "Cancel"
            })]
          }), error && /* @__PURE__ */ jsx("div", {
            className: "text-red-500 text-sm",
            children: error
          }), preview && /* @__PURE__ */ jsx("div", {
            className: "mt-4 bg-gray-50 p-3 rounded",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center space-x-3",
              children: [preview.image && /* @__PURE__ */ jsx("img", {
                src: preview.image,
                alt: preview.name,
                className: "w-14 h-14 object-cover rounded"
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("div", {
                  className: "font-semibold",
                  children: preview.name
                }), /* @__PURE__ */ jsxs("div", {
                  className: "text-sm",
                  children: ["₹", preview.price, " • ID: ", preview.id ?? preview._id ?? itemId]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "text-sm text-gray-600",
                  children: ["Subtotal: ₹", (preview.price || 0) * quantity]
                })]
              })]
            })
          })]
        })]
      })
    })
  });
};
function OrderDetailPage({
  order,
  onBack,
  OpenModel,
  orderIndex,
  orders: orders2,
  updateOrder
}) {
  const [items, setItems] = useState(order.items);
  const [editedItems, setEditedItems] = useState([]);
  const [totalDelta, setTotalDelta] = useState(0);
  useEffect(() => {
    setItems(order.items);
  }, [order.items]);
  const updateQty = useCallback((id, delta, index2) => {
    if (items[index2].status !== "pending") {
      return alert("You can only update unprepared items");
    }
    setEditedItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === id);
      let updated = [...prev];
      if (existingIndex >= 0) {
        const newQty = Math.max(1, updated[existingIndex].quantity + delta);
        setTotalDelta((curr) => curr + (newQty - updated[existingIndex].quantity) * (items[index2].price || 0));
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
        };
      } else {
        setTotalDelta((curr) => curr + delta * (items[index2].price || 0));
        updated.push({
          id,
          quantity: (items[index2].quantity || 0) + delta
        });
      }
      return updated;
    });
  }, [items]);
  const handleSave = async () => {
    try {
      await ordersAPI.updateItems(order.id, editedItems);
      onBack();
    } catch (err) {
      console.error("Failed to save changes:", err);
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header2, {}), /* @__PURE__ */ jsxs("div", {
      className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
      children: [/* @__PURE__ */ jsxs(Button, {
        variant: "ghost",
        onClick: onBack,
        className: "mb-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50",
        children: [/* @__PURE__ */ jsx(ArrowLeft, {
          className: "w-4 h-4 mr-2"
        }), " Back to Orders"]
      }), /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col sm:flex-row justify-between items-start gap-4 mb-6",
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsxs("h1", {
            className: "text-3xl font-bold text-gray-900 mb-2",
            children: ["Order #", order.orderNumber]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center gap-4 text-gray-600",
            children: [/* @__PURE__ */ jsx(MapPin, {
              className: "w-4 h-4"
            }), /* @__PURE__ */ jsxs("span", {
              children: ["Table ", order.tableNumber]
            })]
          })]
        }), /* @__PURE__ */ jsx(StatusBadge, {
          status: order.status
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "space-y-4 mb-8",
        children: orders2[orderIndex].items.map((item, i) => {
          const edited = editedItems.find((e) => e.id === item.id);
          const qty = (edited == null ? void 0 : edited.quantity) ?? item.quantity;
          return /* @__PURE__ */ jsx(Card, {
            className: "border-0 shadow-md hover:shadow-lg transition-shadow",
            children: /* @__PURE__ */ jsxs(CardContent, {
              className: "p-6 flex flex-col sm:flex-row sm:items-center gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex-1",
                children: [/* @__PURE__ */ jsx("h3", {
                  className: "font-bold text-gray-900 text-lg",
                  children: item.name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-gray-700",
                  children: ["₹", item.price, " × ", qty, " =", " ", /* @__PURE__ */ jsxs("span", {
                    className: "font-semibold",
                    children: ["₹", (item.price || 0) * (qty || 0)]
                  })]
                }), /* @__PURE__ */ jsx("div", {
                  className: "mt-1",
                  children: /* @__PURE__ */ jsx(StatusBadge, {
                    status: item.status
                  })
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3 bg-gray-50 rounded-lg p-3",
                children: [/* @__PURE__ */ jsx(Button, {
                  size: "icon",
                  variant: "outline",
                  onClick: () => updateQty(item.id, -1, i),
                  className: "h-10 w-10 rounded-full hover:bg-red-50 hover:border-red-200",
                  disabled: (qty ?? 1) <= 1 && (order.status === "cancelled" || order.status === "completed"),
                  children: /* @__PURE__ */ jsx(Minus, {
                    className: "w-4 h-4"
                  })
                }), /* @__PURE__ */ jsx("span", {
                  className: "px-4 py-2 font-bold text-lg min-w-[3rem] text-center",
                  children: qty
                }), /* @__PURE__ */ jsx(Button, {
                  size: "icon",
                  variant: "outline",
                  disabled: order.status === "cancelled" || order.status === "completed",
                  onClick: () => updateQty(item.id, 1, i),
                  className: "h-10 w-10 rounded-full hover:bg-green-50 hover:border-green-200",
                  children: /* @__PURE__ */ jsx(Plus, {
                    className: "w-4 h-4"
                  })
                })]
              })]
            })
          }, item.id ?? `${item.name}-${i}`);
        })
      }), /* @__PURE__ */ jsx(Card, {
        className: "border-0 shadow-lg",
        children: /* @__PURE__ */ jsxs(CardContent, {
          className: "p-6 flex flex-col sm:flex-row justify-between items-center gap-6",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-sm text-gray-500 mb-1",
              children: "Total Amount"
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-3xl font-bold text-gray-900",
              children: ["₹", (order.totalAmount || 0) + (totalDelta || 0)]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-wrap gap-3",
            children: [/* @__PURE__ */ jsxs(Button, {
              variant: "outline",
              onClick: () => {
                updateOrder(order.id, "cancelled");
              },
              disabled: order.status === "cancelled" || order.status === "completed",
              className: "text-red-600 border-red-200 hover:bg-red-50 px-6",
              children: [/* @__PURE__ */ jsx(XCircle, {
                className: "w-4 h-4 mr-2"
              }), " Cancel"]
            }), /* @__PURE__ */ jsxs(Button, {
              variant: "outline",
              disabled: order.status === "cancelled" || order.status === "completed",
              onClick: () => {
                updateOrder(order.id, "completed");
              },
              className: "text-green-600 border-green-200 hover:bg-green-50 px-6",
              children: [/* @__PURE__ */ jsx(CheckCircle, {
                className: "w-4 h-4 mr-2"
              }), " Complete"]
            }), editedItems.length > 0 && /* @__PURE__ */ jsx(Button, {
              className: "bg-blue-600 hover:bg-blue-700 px-6",
              onClick: handleSave,
              children: "Save Changes"
            }), /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => {
                OpenModel(true);
              },
              disabled: order.status === "cancelled" || order.status === "completed",
              className: "text-green-600 border-green-200 hover:bg-green-50 px-6",
              children: "add new item"
            })]
          })]
        })
      })]
    })]
  });
}
const Orders = UNSAFE_withComponentProps(function OrdersWrapper() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders2, setOrders] = useState([]);
  const [orderIndex, setOrderIndex] = useState();
  const prevOrdersRef = useRef([]);
  const socketRef = useRef(null);
  const [orderId, setOrderId] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const handleItemAdded = (item) => {
    orders2[orderIndex].items.push(item);
  };
  const {
    toasts,
    push,
    remove
  } = useToasts$2();
  const SOCKET_URL2 = api.defaults.baseURL || "http://localhost:3000";
  useEffect(() => {
    ordersAPI.getAll().then((res) => {
      setOrders(res.data);
      console.log(res.data);
      prevOrdersRef.current = res.data;
    }).catch((err) => console.error("Failed to load orders:", err));
  }, []);
  const refreshAndDiff = useCallback(async (hintStatus, isItemEvent) => {
    try {
      const res = await ordersAPI.getAll();
      const next = res.data;
      const prev = prevOrdersRef.current;
      setOrders(next);
      prevOrdersRef.current = next;
      if (selectedOrder) {
        const updatedSelected = next.find((o) => o.id === selectedOrder.id);
        if (updatedSelected) {
          setSelectedOrder(updatedSelected);
        }
      }
      let orderMsg = null;
      let itemMsg = null;
      const prevMap = /* @__PURE__ */ new Map();
      for (const o of prev) prevMap.set(o.id, o);
      for (const o of next) {
        const p = prevMap.get(o.id);
        if (p && p.status !== o.status) {
          if (!hintStatus || o.status === hintStatus) {
            orderMsg = `Order #${o.orderNumber} status is ${o.status}`;
            break;
          }
        }
      }
      if (isItemEvent || !orderMsg) {
        for (const o of next) {
          const p = prevMap.get(o.id);
          if (!p) continue;
          const pItemsByKey = /* @__PURE__ */ new Map();
          p.items.forEach((it, idx) => {
            const key = (it == null ? void 0 : it.id) ?? `${it == null ? void 0 : it.name}-${idx}`;
            pItemsByKey.set(String(key), it);
          });
          for (let idx = 0; idx < o.items.length; idx++) {
            const it = o.items[idx];
            const key = String((it == null ? void 0 : it.id) ?? `${it == null ? void 0 : it.name}-${idx}`);
            const prevIt = pItemsByKey.get(key);
            if (prevIt && prevIt.status !== it.status) {
              if (!hintStatus || it.status === hintStatus) {
                itemMsg = `Order #${o.orderNumber} → "${it.name}" is ${it.status}`;
                break;
              }
            }
          }
          if (itemMsg) break;
        }
      }
      if (itemMsg) push(itemMsg);
      else if (orderMsg) push(orderMsg);
    } catch (err) {
      console.error("Refresh after socket event failed:", err);
    }
  }, [push, selectedOrder]);
  async function OrderStatusUpdate(orderId2, status) {
    try {
      ordersAPI.updateStatus(orderId2, status);
    } catch {
    }
  }
  useEffect(() => {
    const s = io(SOCKET_URL2, {
      transports: ["websocket"]
      // If you later add auth, pass token here:
      // auth: { token: typeof window !== "undefined" ? localStorage.getItem("token") : undefined }
    });
    socketRef.current = s;
    s.on("OrderStatus", async (payload) => {
      await refreshAndDiff(payload == null ? void 0 : payload.status, false);
    });
    s.on("ItemStatus", async (payload) => {
      await refreshAndDiff(payload == null ? void 0 : payload.status, true);
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_URL2, refreshAndDiff]);
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Header$2, {
      navigate
    }), /* @__PURE__ */ jsx(Toasts$1, {
      toasts,
      onClose: remove
    }), /* @__PURE__ */ jsx(AddItemToOrderModal, {
      orderId,
      isOpen,
      onClose: () => setIsOpen(false),
      onAdded: handleItemAdded
    }), selectedOrder ? /* @__PURE__ */ jsx(OrderDetailPage, {
      order: selectedOrder,
      onBack: () => setSelectedOrder(null),
      OpenModel: setIsOpen,
      updateOrder: OrderStatusUpdate,
      orderIndex,
      orders: orders2
    }) : /* @__PURE__ */ jsx(OrdersPage, {
      onViewOrder: setSelectedOrder,
      updateOrder: OrderStatusUpdate,
      orders: orders2,
      setIndex: (i) => setOrderIndex(i),
      setOrderId
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  OrderDetailPage,
  OrdersPage,
  default: Orders
}, Symbol.toStringTag, { value: "Module" }));
const Header$1 = ({ currentPage = "", navigate }) => /* @__PURE__ */ jsx("header", { className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
  /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold", children: "Cafe Zam Zam" }),
    /* @__PURE__ */ jsx("p", { className: "text-blue-100 text-sm", children: "Chef Interface" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/chef"),
        className: `backdrop-blur-sm rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${currentPage === "orders" ? "bg-white/30" : "bg-white/20 hover:bg-white/30"}`,
        children: /* @__PURE__ */ jsx("span", { children: "Orders" })
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => navigate("/chef/menu"),
        className: `rounded-lg px-4 py-2 transition-all duration-300 flex items-center space-x-2 ${currentPage === "new-order" ? "bg-green-600" : "bg-green-500 hover:bg-green-600"}`,
        children: /* @__PURE__ */ jsx("span", { children: "Menu" })
      }
    )
  ] })
] }) }) });
const SOCKET_URL = "http://localhost:3000";
function toId(x) {
  return String(x);
}
const index$2 = UNSAFE_withComponentProps(function ChefDashboard() {
  const [orders2, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filter, setFilter] = useState("all");
  const seenOrderIds = useRef(/* @__PURE__ */ new Set());
  const seenItemIds = useRef(/* @__PURE__ */ new Set());
  const [newOrders, setNewOrders] = useState(/* @__PURE__ */ new Set());
  const [newItems, setNewItems] = useState(/* @__PURE__ */ new Set());
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const showToast = (type, title, message, ttl = 4e3) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const t = {
      id,
      title,
      message,
      type
    };
    setToasts((s) => [t, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), ttl);
  };
  async function OrderStatusUpdate(orderId, status) {
    try {
      ordersAPI.updateStatus(orderId, status);
    } catch {
    }
  }
  useEffect(() => {
    let mounted = true;
    (async () => {
      var _a;
      try {
        const {
          data
        } = await ordersAPI.getAll();
        if (!mounted) return;
        const orderIds = /* @__PURE__ */ new Set();
        const itemIds = /* @__PURE__ */ new Set();
        data.forEach((o) => {
          orderIds.add(o.id);
          o.items.forEach((it) => itemIds.add(toId(it.id ?? `${o.id}:${it.name}`)));
        });
        seenOrderIds.current = orderIds;
        seenItemIds.current = itemIds;
        setNewOrders(/* @__PURE__ */ new Set());
        setNewItems(/* @__PURE__ */ new Set());
        setOrders(sortOrders(data, /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()));
        setExpandedOrderId(((_a = data[0]) == null ? void 0 : _a.id) ?? null);
      } catch (e) {
        console.error("Failed to load orders:", e);
        showToast("error", "Load failed", "Unable to fetch orders");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  async function refreshOrdersPreservingNewFlags() {
    try {
      const {
        data
      } = await ordersAPI.getAll();
      const nextNewOrders = new Set(newOrders);
      const nextNewItems = new Set(newItems);
      const prevMap = new Map(orders2.map((o) => [o.id, o]));
      const incomingMap = new Map(data.map((o) => [o.id, o]));
      const cancelledIds = [];
      for (const [id, prev] of prevMap.entries()) {
        const incoming = incomingMap.get(id);
        if (incoming && prev.status !== "cancelled" && incoming.status === "cancelled") {
          cancelledIds.push(id);
        }
      }
      for (const id of cancelledIds) {
        nextNewOrders.delete(id);
        const prev = prevMap.get(id);
        prev == null ? void 0 : prev.items.forEach((it) => {
          const key = toId(it.id ?? `${id}:${it.name}:${it.quantity}:${it.price}`);
          nextNewItems.delete(key);
        });
        showToast("error", "Order cancelled", `Order #${(prev == null ? void 0 : prev.orderNumber) ?? id} was cancelled`);
      }
      data.forEach((o) => {
        if (!seenOrderIds.current.has(o.id)) {
          nextNewOrders.add(o.id);
          seenOrderIds.current.add(o.id);
        }
        o.items.forEach((it) => {
          const iid = toId(it.id ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
          if (!seenItemIds.current.has(iid)) {
            nextNewItems.add(iid);
            seenItemIds.current.add(iid);
          }
        });
      });
      setNewOrders(nextNewOrders);
      setNewItems(nextNewItems);
      const filtered = data.filter((o) => o.status !== "cancelled");
      setOrders(sortOrders(filtered, nextNewOrders, nextNewItems));
      if (expandedOrderId && cancelledIds.includes(expandedOrderId)) {
        setExpandedOrderId(null);
      }
    } catch (e) {
      console.error("Failed to refresh orders:", e);
      showToast("error", "Refresh failed", "Unable to refresh orders");
    }
  }
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"]
    });
    socketRef.current = socket;
    socket.on("newOrder", async ({
      order
    }) => {
      try {
        const nid = toId(order.id);
        const newOrderSet = new Set(newOrders);
        newOrderSet.add(nid);
        const newItemSet = new Set(newItems);
        order.items.forEach((it) => {
          const iid = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
          newItemSet.add(iid);
        });
        seenOrderIds.current.add(nid);
        order.items.forEach((it) => seenItemIds.current.add(toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`)));
        setNewOrders(newOrderSet);
        setNewItems(newItemSet);
        setOrders((prev) => sortOrders([order, ...dedupeOrders(prev, nid)], newOrderSet, newItemSet));
        setExpandedOrderId(nid);
        showToast("success", "New order", `Order #${order.orderNumber ?? order.id} received`);
      } catch (e) {
        console.error("Failed to process newOrder:", e);
      }
    });
    socket.on("OrderStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });
    socket.on("ItemStatus", async () => {
      await refreshOrdersPreservingNewFlags();
    });
    socket.on("newItemAddtoOrder", async () => {
      try {
        const {
          data
        } = await ordersAPI.getAll();
        const newOrderSet = new Set(newOrders);
        const newItemSet = new Set(newItems);
        let bumpedOrderId = null;
        data.forEach((o) => {
          let anyNewInThisOrder = false;
          o.items.forEach((it) => {
            const iid = toId(it.id ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
            if (!seenItemIds.current.has(iid)) {
              anyNewInThisOrder = true;
              newItemSet.add(iid);
              seenItemIds.current.add(iid);
            }
          });
          if (anyNewInThisOrder) {
            newOrderSet.add(o.id);
            bumpedOrderId = o.id;
          }
        });
        setNewOrders(newOrderSet);
        setNewItems(newItemSet);
        setOrders(sortOrders(data, newOrderSet, newItemSet));
        if (bumpedOrderId) setExpandedOrderId(bumpedOrderId);
        if (bumpedOrderId) {
          showToast("info", "New items", `New items added to Order #${bumpedOrderId}`);
        }
      } catch (e) {
        console.error("Failed to process newItemAddtoOrder:", e);
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [newOrders, newItems]);
  const updateItemStatus = async (orderId, itemId, status) => {
    try {
      setOrders((prev) => sortOrders(prev.map((o) => o.id !== orderId ? o : {
        ...o,
        items: o.items.map((it) => {
          const iid = it.id;
          if (iid === itemId) {
            const itemKey = toId(iid ?? `${o.id}:${it.name}:${it.quantity}:${it.price}`);
            const ni = new Set(newItems);
            ni.delete(itemKey);
            setNewItems(ni);
            return {
              ...it,
              status
            };
          }
          return it;
        })
      }), newOrders, newItems));
      await ordersAPI.updateItemStatus(orderId, itemId, status);
    } catch (e) {
      console.error(e);
      await refreshOrdersPreservingNewFlags();
    }
  };
  const clearOrderNewFlag = (orderId) => {
    const no = new Set(newOrders);
    if (no.has(orderId)) {
      no.delete(orderId);
      setNewOrders(no);
    }
  };
  const counts = useMemo(() => {
    const newCount = orders2.filter((o) => isOrderNew(o, newOrders, newItems)).length;
    const inProg = orders2.filter((o) => o.status === "preparing").length;
    const ready = orders2.filter((o) => o.status === "ready").length;
    return {
      newCount,
      inProg,
      ready,
      totalItems: orders2.reduce((a, o) => a + o.items.length, 0)
    };
  }, [orders2, newOrders, newItems]);
  const visibleOrders = useMemo(() => {
    const sorted = sortOrders(orders2, newOrders, newItems);
    if (filter === "all") return sorted;
    if (filter === "new") return sorted.filter((o) => isOrderNew(o, newOrders, newItems));
    if (filter === "in-progress") return sorted.filter((o) => o.status === "preparing");
    if (filter === "ready") return sorted.filter((o) => o.status === "ready");
    return sorted;
  }, [orders2, filter, newOrders, newItems]);
  const toggleExpand = (id) => setExpandedOrderId((prev) => prev === id ? null : id);
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen bg-gray-50",
    children: [/* @__PURE__ */ jsx(Header$1, {
      navigate
    }), /* @__PURE__ */ jsx("div", {
      className: "fixed top-6 right-6 z-50 flex flex-col gap-3",
      children: toasts.map((t) => /* @__PURE__ */ jsx("div", {
        role: "alert",
        className: `max-w-sm w-full rounded-lg shadow-lg p-3 border flex flex-col gap-1 transition-transform transform-gpu ` + (t.type === "success" ? "bg-white border-green-200" : t.type === "error" ? "bg-white border-red-200" : "bg-white border-blue-200"),
        children: /* @__PURE__ */ jsxs("div", {
          className: "flex items-start justify-between gap-2",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex-1",
            children: [t.title && /* @__PURE__ */ jsx("div", {
              className: "font-semibold text-sm text-gray-900",
              children: t.title
            }), /* @__PURE__ */ jsx("div", {
              className: "text-xs text-gray-600",
              children: t.message
            })]
          }), /* @__PURE__ */ jsx("button", {
            "aria-label": "dismiss",
            onClick: () => setToasts((s) => s.filter((x) => x.id !== t.id)),
            className: "text-gray-400 hover:text-gray-600",
            children: "✕"
          })]
        })
      }, t.id))
    }), /* @__PURE__ */ jsxs("div", {
      className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
      children: [/* @__PURE__ */ jsx("div", {
        className: "mb-8",
        children: /* @__PURE__ */ jsx("div", {
          className: "border-b border-gray-200 bg-white rounded-lg shadow-sm",
          children: /* @__PURE__ */ jsx("nav", {
            className: "flex space-x-8 px-6",
            "aria-label": "Tabs",
            children: [{
              key: "all",
              label: "All Orders",
              count: orders2.length,
              icon: Filter
            }, {
              key: "new",
              label: "New Orders",
              count: counts.newCount,
              icon: Clock
            }, {
              key: "in-progress",
              label: "In Progress",
              count: counts.inProg,
              icon: ChefHat
            }, {
              key: "ready",
              label: "Ready",
              count: counts.ready,
              icon: Package
            }].map((t) => {
              const Icon = t.icon;
              return /* @__PURE__ */ jsxs("button", {
                onClick: () => setFilter(t.key),
                className: `${filter === t.key ? "border-blue-500 text-blue-600 bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 rounded-t-lg`,
                children: [/* @__PURE__ */ jsx(Icon, {
                  className: "w-4 h-4"
                }), t.label, t.count > 0 && /* @__PURE__ */ jsx(Badge, {
                  className: `ml-2 ${filter === t.key ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`,
                  children: t.count
                })]
              }, t.key);
            })
          })
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8",
        children: [/* @__PURE__ */ jsx(Card, {
          className: "border-0 shadow-md bg-gradient-to-r from-yellow-50 to-yellow-100",
          children: /* @__PURE__ */ jsx(CardContent, {
            className: "p-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-medium text-yellow-800",
                  children: "New Orders"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-2xl font-bold text-yellow-900",
                  children: counts.newCount
                })]
              }), /* @__PURE__ */ jsx(Clock, {
                className: "w-8 h-8 text-yellow-600"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(Card, {
          className: "border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100",
          children: /* @__PURE__ */ jsx(CardContent, {
            className: "p-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-medium text-blue-800",
                  children: "In Progress"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-2xl font-bold text-blue-900",
                  children: counts.inProg
                })]
              }), /* @__PURE__ */ jsx(ChefHat, {
                className: "w-8 h-8 text-blue-600"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(Card, {
          className: "border-0 shadow-md bg-gradient-to-r from-red-50 to-red-100",
          children: /* @__PURE__ */ jsx(CardContent, {
            className: "p-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-medium text-red-800",
                  children: "Ready"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-2xl font-bold text-red-900",
                  children: counts.ready
                })]
              }), /* @__PURE__ */ jsx(Package, {
                className: "w-8 h-8 text-red-600"
              })]
            })
          })
        }), /* @__PURE__ */ jsx(Card, {
          className: "border-0 shadow-md bg-gradient-to-r from-green-50 to-green-100",
          children: /* @__PURE__ */ jsx(CardContent, {
            className: "p-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex items-center justify-between",
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("p", {
                  className: "text-sm font-medium text-green-800",
                  children: "Total Items"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-2xl font-bold text-green-900",
                  children: counts.totalItems
                })]
              }), /* @__PURE__ */ jsx(Users, {
                className: "w-8 h-8 text-green-600"
              })]
            })
          })
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "space-y-6",
        children: visibleOrders.length === 0 ? /* @__PURE__ */ jsx(EmptyState, {
          filter
        }) : visibleOrders.map((order) => {
          var _a;
          const isNew = isOrderNew(order, newOrders, newItems);
          return /* @__PURE__ */ jsxs(Card, {
            className: "shadow-lg rounded-2xl border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300",
            children: [/* @__PURE__ */ jsxs(CardHeader, {
              className: "flex flex-row items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-200 p-6",
              onClick: () => {
                toggleExpand(order.id);
                clearOrderNewFlag(order.id);
              },
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex items-start space-x-4",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex-1",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-3 mb-2",
                    children: [/* @__PURE__ */ jsxs("h2", {
                      className: "text-xl font-bold text-gray-900",
                      children: ["Order #", order.orderNumber || order.id]
                    }), /* @__PURE__ */ jsx(OrderStatusBadge, {
                      order
                    }), isNew && /* @__PURE__ */ jsx(Badge, {
                      className: "bg-red-100 text-red-700 border-red-200 px-2 py-1 text-xs",
                      children: "NEW"
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-4 text-sm text-gray-600",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */ jsx(MapPin, {
                        className: "w-4 h-4"
                      }), /* @__PURE__ */ jsxs("span", {
                        children: ["Table ", order.tableNumber ?? "—"]
                      })]
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */ jsx(Clock, {
                        className: "w-4 h-4"
                      }), /* @__PURE__ */ jsx("span", {
                        children: new Date(order.createdAt).toLocaleTimeString()
                      })]
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-1",
                      children: [/* @__PURE__ */ jsx(UserCheck, {
                        className: "w-4 h-4"
                      }), /* @__PURE__ */ jsx("span", {
                        children: ((_a = order.waiter) == null ? void 0 : _a.username) ?? "Waiter"
                      })]
                    }), /* @__PURE__ */ jsx("div", {
                      className: "flex items-center gap-1",
                      children: /* @__PURE__ */ jsxs("span", {
                        className: "font-semibold",
                        children: ["₹", order.totalAmount]
                      })
                    }), /* @__PURE__ */ jsx("div", {
                      className: "flex items-center gap-1",
                      children: /* @__PURE__ */ jsxs("span", {
                        children: [order.items.length, " items"]
                      })
                    })]
                  })]
                })
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-3",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "hidden sm:flex gap-2",
                  children: /* @__PURE__ */ jsxs(Button, {
                    variant: "outline",
                    size: "sm",
                    className: "text-red-600 border-red-200 hover:bg-red-50",
                    onClick: (e) => {
                      e.stopPropagation();
                      OrderStatusUpdate(order.id, "cancelled");
                    },
                    children: [/* @__PURE__ */ jsx(XCircle, {
                      className: "w-4 h-4 mr-2"
                    }), "Cancel Order"]
                  })
                }), expandedOrderId === order.id ? /* @__PURE__ */ jsx(ChevronUp, {
                  className: "w-6 h-6 text-gray-400"
                }) : /* @__PURE__ */ jsx(ChevronDown, {
                  className: "w-6 h-6 text-gray-400"
                })]
              })]
            }), expandedOrderId === order.id && /* @__PURE__ */ jsxs(CardContent, {
              className: "bg-gray-50 p-6 space-y-4",
              children: [/* @__PURE__ */ jsx("div", {
                className: "flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 pb-4 border-b border-gray-200",
                children: /* @__PURE__ */ jsxs("h3", {
                  className: "font-semibold text-gray-900 mb-2 sm:mb-0 flex items-center gap-2",
                  children: [/* @__PURE__ */ jsx(ChefHat, {
                    className: "w-5 h-5"
                  }), "Order Items"]
                })
              }), order.items.map((it) => {
                const itemKey = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
                const isNewItem = newItems.has(itemKey);
                return /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl bg-white border shadow-sm gap-4",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "flex-1",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-3 mb-2",
                      children: [/* @__PURE__ */ jsx("p", {
                        className: "font-semibold text-gray-900 text-lg",
                        children: it.name
                      }), /* @__PURE__ */ jsx(ItemStatusBadge, {
                        status: it.status
                      }), isNewItem && /* @__PURE__ */ jsx(Badge, {
                        className: "bg-red-100 text-red-700 border-red-200 px-2 py-0.5 text-xs",
                        children: "NEW"
                      })]
                    }), /* @__PURE__ */ jsxs("p", {
                      className: "text-sm text-gray-600",
                      children: ["Quantity: ", /* @__PURE__ */ jsx("span", {
                        className: "font-semibold",
                        children: it.quantity
                      })]
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex gap-2",
                    children: [it.status === "pending" && /* @__PURE__ */ jsxs(Button, {
                      variant: "default",
                      size: "sm",
                      className: "bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2",
                      onClick: () => updateItemStatus(order.id, it.id, "preparing"),
                      children: [/* @__PURE__ */ jsx(ChefHat, {
                        className: "w-4 h-4"
                      }), "Prepare"]
                    }), it.status === "preparing" && /* @__PURE__ */ jsxs(Button, {
                      variant: "outline",
                      size: "sm",
                      className: "text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2",
                      onClick: () => updateItemStatus(order.id, it.id, "ready"),
                      children: [/* @__PURE__ */ jsx(Package, {
                        className: "w-4 h-4"
                      }), "Mark Ready"]
                    }), it.status === "ready" && /* @__PURE__ */ jsxs(Button, {
                      variant: "outline",
                      size: "sm",
                      className: "text-green-600 border-green-200 cursor-not-allowed opacity-50",
                      disabled: true,
                      children: [/* @__PURE__ */ jsx(CheckCircle, {
                        className: "w-4 h-4"
                      }), "Ready"]
                    })]
                  })]
                }, itemKey);
              }), /* @__PURE__ */ jsx("div", {
                className: "sm:hidden flex gap-2 pt-4 border-t",
                children: /* @__PURE__ */ jsxs(Button, {
                  variant: "outline",
                  size: "sm",
                  className: "flex-1 text-red-600 border-red-200 hover:bg-red-50",
                  onClick: () => cancelOrder(order.id),
                  children: [/* @__PURE__ */ jsx(XCircle, {
                    className: "w-4 h-4 mr-2"
                  }), "Cancel Order"]
                })
              })]
            })]
          }, order.id);
        })
      })]
    })]
  });
});
function ItemStatusBadge({
  status
}) {
  const map = {
    pending: {
      cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Icon: Clock
    },
    preparing: {
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      Icon: ChefHat
    },
    ready: {
      cls: "bg-green-100 text-green-800 border-green-200",
      Icon: CheckCircle
    }
  };
  const cfg = map[status] ?? map.pending;
  return /* @__PURE__ */ jsxs(Badge, {
    className: `${cfg.cls} border px-2 py-0.5 text-xs flex items-center gap-1 font-medium`,
    children: [/* @__PURE__ */ jsx(cfg.Icon, {
      className: "w-3 h-3"
    }), /* @__PURE__ */ jsx("span", {
      className: "capitalize",
      children: cfg.label ?? status
    })]
  });
}
function OrderStatusBadge({
  order
}) {
  const map = {
    pending: {
      cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Icon: Clock
    },
    preparing: {
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      Icon: ChefHat,
      label: "In Progress"
    },
    ready: {
      cls: "bg-green-100 text-green-800 border-green-200",
      Icon: CheckCircle
    },
    completed: {
      cls: "bg-gray-100 text-gray-700 border-gray-200",
      Icon: Timer
    },
    cancelled: {
      cls: "bg-red-100 text-red-800 border-red-200",
      Icon: AlertTriangle
    }
  };
  const cfg = map[order.status] ?? map.pending;
  return /* @__PURE__ */ jsxs(Badge, {
    className: `${cfg.cls} border px-3 py-1 text-sm flex items-center gap-1 font-medium`,
    children: [/* @__PURE__ */ jsx(cfg.Icon, {
      className: "w-4 h-4"
    }), /* @__PURE__ */ jsx("span", {
      className: "capitalize",
      children: cfg.label ?? order.status
    })]
  });
}
function EmptyState({
  filter
}) {
  const copy = {
    all: {
      title: "No orders in kitchen",
      desc: "New orders will appear here when customers place them."
    },
    new: {
      title: "No new orders",
      desc: "New orders will appear here when customers place them."
    },
    "in-progress": {
      title: "No orders in progress",
      desc: "Orders being prepared will appear here."
    },
    ready: {
      title: "No ready orders",
      desc: "Completed orders will appear here."
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "text-center py-12",
    children: [/* @__PURE__ */ jsx(ChefHat, {
      className: "w-16 h-16 text-gray-300 mx-auto mb-4"
    }), /* @__PURE__ */ jsx("h3", {
      className: "text-xl font-semibold text-gray-900 mb-2",
      children: copy[filter].title
    }), /* @__PURE__ */ jsx("p", {
      className: "text-gray-600",
      children: copy[filter].desc
    })]
  });
}
function isOrderNew(order, newOrders, newItems) {
  if (newOrders.has(order.id)) return true;
  return order.items.some((it) => {
    const key = toId(it.id ?? `${order.id}:${it.name}:${it.quantity}:${it.price}`);
    return newItems.has(key);
  });
}
function sortOrders(list, newOrders, newItems) {
  const score = (o) => isOrderNew(o, newOrders, newItems) ? 1 : 0;
  return [...list].sort((a, b) => {
    const s = score(b) - score(a);
    if (s !== 0) return s;
    const at = new Date(a.updatedAt || a.createdAt).getTime();
    const bt = new Date(b.updatedAt || b.createdAt).getTime();
    return bt - at;
  });
}
function dedupeOrders(list, idToKeepFirst) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const o of list) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    out.push(o);
  }
  out.sort((x, y) => x.id === idToKeepFirst ? -1 : y.id === idToKeepFirst ? 1 : 0);
  return out;
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$2
}, Symbol.toStringTag, { value: "Module" }));
function Select({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Root, { "data-slot": "select", ...props });
}
function SelectValue({
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Value, { "data-slot": "select-value", ...props });
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Trigger,
    {
      "data-slot": "select-trigger",
      "data-size": size,
      className: cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4 opacity-50" }) })
      ]
    }
  );
}
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}) {
  return /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    SelectPrimitive.Content,
    {
      "data-slot": "select-content",
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          SelectPrimitive.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
}
function SelectItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Item,
    {
      "data-slot": "select-item",
      className: cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("span", { className: "absolute right-2 flex size-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-4" }) }) }),
        /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
      ]
    }
  );
}
function SelectScrollUpButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollUpButton,
    {
      "data-slot": "select-scroll-up-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronUpIcon, { className: "size-4" })
    }
  );
}
function SelectScrollDownButton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SelectPrimitive.ScrollDownButton,
    {
      "data-slot": "select-scroll-down-button",
      className: cn(
        "flex cursor-default items-center justify-center py-1",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(ChevronDownIcon, { className: "size-4" })
    }
  );
}
function Dialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Root, { "data-slot": "dialog", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            DialogPrimitive.Close,
            {
              "data-slot": "dialog-close",
              className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx(XIcon, {}),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function Header({ navigate }) {
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("aside", { className: "w-64 bg-white shadow-md p-6 flex flex-col gap-6", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-800 mb-4", onClick: () => {
      navigate("/admin");
    }, children: "Admin Panel" }),
    /* @__PURE__ */ jsxs("nav", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            navigate("/admin/menu");
          },
          className: "flex items-center gap-2 text-gray-700 hover:text-blue-600",
          children: [
            /* @__PURE__ */ jsx(LayoutList, { className: "w-5 h-5" }),
            "Menu Management"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            navigate("/admin/orders");
          },
          className: "flex items-center gap-2 text-gray-700 hover:text-blue-600",
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5" }),
            "Orders"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            navigate("/admin/addOrder");
          },
          className: "flex items-center gap-2 text-gray-700 hover:text-blue-600",
          children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "w-5 h-5" }),
            "Add Orders"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => {
            navigate("/admin/users");
          },
          className: "flex items-center gap-2 text-gray-700 hover:text-blue-600",
          children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "w-5 h-5" }),
            "Users"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            navigate("/admin/insights");
          },
          className: "flex items-center gap-2 text-gray-700 hover:text-blue-600",
          children: "Insights"
        }
      )
    ] })
  ] }) });
}
function printBill(order) {
  const cgst = (order.totalAmount * 0.025).toFixed(2);
  const sgst = (order.totalAmount * 0.025).toFixed(2);
  const grandTotal = (order.totalAmount + parseFloat(cgst) + parseFloat(sgst)).toFixed(2);
  const billHtml = `
    <div style="font-family: Courier New, monospace; font-size: 14px; width: 320px;">
      <div style="text-align:center; font-weight:bold;">Cafe Zam Zam</div>
      <div style="text-align:center;">Pune</div>
      <div style="text-align:center;">GSTIN: 29ABCDE1234F1Z5</div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <div>
        Bill No: ${order.orderNumber}
        <span style="float:right">Dt: ${new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      <div>
        Time: ${new Date(order.createdAt).toLocaleTimeString()} &nbsp; Waiter: ${order.waiterId} &nbsp; Table: ${order.tableNumber}
      </div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td><b>Description</b></td>
          <td style="text-align:right;"><b>Qty</b></td>
          <td style="text-align:right;"><b>Amount</b></td>
        </tr>
        ${order.items.map((item) => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align:right;">${item.quantity}</td>
            <td style="text-align:right;">${item.totalPrice.toFixed(2)}</td>
          </tr>
        `).join("")}
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%;">
        <tr><td><b>Total Amount</b></td><td style="text-align:right;">${order.totalAmount.toFixed(2)}</td></tr>
        <tr><td>CGST 2.5%</td><td style="text-align:right;">${cgst}</td></tr>
        <tr><td>SGST 2.5%</td><td style="text-align:right;">${sgst}</td></tr>
        <tr><td><b>Bill Amount</b></td><td style="text-align:right;"><b>${grandTotal}</b></td></tr>
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>
      <div style="text-align:center;">Thank You! Visit Again</div>
    </div>
  `;
  const printWindow = window.open("", "", "width=400,height=600");
  printWindow.document.write(`<html><head><title>Bill</title></head><body>${billHtml}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
function useToasts$1() {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{
      id,
      message
    }, ...t]);
    setTimeout(() => remove(id), 4e3);
  }, [remove]);
  return {
    toasts,
    push,
    remove
  };
}
const AdminDashboard = () => {
  var _a;
  const socketRef = useRef(null);
  const SOCKET_URL2 = api.defaults.baseURL || "http://localhost:3000";
  const {
    push
  } = useToasts$1();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    preparing: 0,
    completed: 0,
    cancelled: 0
  });
  const [orders2, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll();
      const normalized = res.data.map((o) => ({
        ...o,
        items: o.items || []
      }));
      setOrders(normalized);
      updateStats(normalized);
    } catch (error) {
      console.error(error);
    }
  };
  const updateStats = (orders22) => {
    setStats({
      totalOrders: orders22.length,
      pending: orders22.filter((o) => o.status === "pending").length,
      preparing: orders22.filter((o) => o.status === "preparing").length,
      completed: orders22.filter((o) => o.status === "completed").length,
      cancelled: orders22.filter((o) => o.status === "cancelled").length
    });
  };
  useEffect(() => {
    const s = io(SOCKET_URL2, {
      transports: ["websocket"]
    });
    socketRef.current = s;
    s.on("OrderStatus", (payload) => {
      setOrders((prevOrders) => prevOrders.map(
        (o) => o.orderNumber === payload.orderNumber ? {
          ...o,
          status: payload.status
        } : o
        // unchanged
      ));
    });
    s.on("newOrder", (payload) => {
      const order = {
        ...payload.order,
        items: payload.order.items || []
      };
      setOrders((prev) => {
        const updated = [...prev, order];
        updateStats(updated);
        return updated;
      });
    });
    s.on("ItemStatus", (payload) => {
      if (payload.waiterId === 0) {
        push(`Order #${payload.orderNumber} - ${payload.name} is ${payload.status}`);
      }
    });
    fetchOrders();
    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL2, push]);
  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded text-xs font-medium capitalize";
    switch (status) {
      case "pending":
        return /* @__PURE__ */ jsx("span", {
          className: `${base} bg-yellow-100 text-yellow-700`,
          children: "Pending"
        });
      case "preparing":
        return /* @__PURE__ */ jsx("span", {
          className: `${base} bg-blue-100 text-blue-700`,
          children: "Preparing"
        });
      case "completed":
        return /* @__PURE__ */ jsx("span", {
          className: `${base} bg-green-100 text-green-700`,
          children: "Completed"
        });
      case "cancelled":
        return /* @__PURE__ */ jsx("span", {
          className: `${base} bg-red-100 text-red-700`,
          children: "Cancelled"
        });
      default:
        return /* @__PURE__ */ jsx("span", {
          className: `${base} bg-gray-100 text-gray-700`,
          children: status
        });
    }
  };
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2);
  };
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updated = await ordersAPI.updateStatus(orderId.toString(), newStatus);
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => o.id === orderId ? {
          ...o,
          status: updated.status
        } : o);
        updateStats(updatedOrders);
        return updatedOrders;
      });
      if ((selectedOrder == null ? void 0 : selectedOrder.id) === orderId) setSelectedOrder(updated);
    } catch (error) {
      console.error(error);
    }
  };
  const UpdateCash = async (orderId) => {
    try {
      const updated = await ordersAPI.submitCash(orderId);
      setOrders((prev) => {
        const updatedOrders = prev.map((o) => o.id === orderId ? {
          ...o,
          cashCollected: true
        } : o);
        updateStats(updatedOrders);
        return updatedOrders;
      });
      if ((selectedOrder == null ? void 0 : selectedOrder.id) === orderId) setSelectedOrder(updated);
    } catch (error) {
      console.error(error);
    }
  };
  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await ordersAPI.delete(orderId.toString());
      setOrders((prev) => {
        const updated = prev.filter((o) => o.id !== orderId);
        updateStats(updated);
        return updated;
      });
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
    }
  };
  const navigate = useNavigate();
  const filteredOrders = filterStatus ? orders2.filter((o) => o.status === filterStatus) : orders2;
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex bg-gray-100",
    children: [/* @__PURE__ */ jsx(Header, {
      navigate
    }), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 p-6",
      children: [/* @__PURE__ */ jsx("h1", {
        className: "text-3xl font-bold text-gray-900 mb-6",
        children: "Admin Dashboard"
      }), /* @__PURE__ */ jsxs("div", {
        className: "grid grid-cols-1 md:grid-cols-5 gap-4 mb-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "Total Orders"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-3xl font-bold",
            children: stats.totalOrders
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "Pending"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-3xl font-bold",
            children: stats.pending
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "Preparing"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-3xl font-bold",
            children: stats.preparing
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "Completed"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-3xl font-bold",
            children: stats.completed
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-sm text-gray-600",
            children: "Cancelled"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-3xl font-bold",
            children: stats.cancelled
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "bg-white rounded-lg shadow-md p-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex justify-between items-center mb-4",
          children: [/* @__PURE__ */ jsx("h2", {
            className: "text-2xl font-bold text-gray-900",
            children: "Orders"
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "mr-2 font-medium",
              children: "Filter by status:"
            }), /* @__PURE__ */ jsxs("select", {
              value: filterStatus,
              onChange: (e) => setFilterStatus(e.target.value),
              className: "border rounded px-2 py-1",
              children: [/* @__PURE__ */ jsx("option", {
                value: "",
                children: "All"
              }), /* @__PURE__ */ jsx("option", {
                value: "pending",
                children: "Pending"
              }), /* @__PURE__ */ jsx("option", {
                value: "preparing",
                children: "Preparing"
              }), /* @__PURE__ */ jsx("option", {
                value: "completed",
                children: "Completed"
              }), /* @__PURE__ */ jsx("option", {
                value: "cancelled",
                children: "Cancelled"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("table", {
          className: "w-full border-collapse border border-gray-200",
          children: [/* @__PURE__ */ jsx("thead", {
            className: "bg-gray-100",
            children: /* @__PURE__ */ jsxs("tr", {
              children: [/* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Order ID"
              }), /* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Waiter"
              }), /* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Total Items"
              }), /* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Total Amount"
              }), /* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Status"
              }), /* @__PURE__ */ jsx("th", {
                className: "border p-2 text-left",
                children: "Actions"
              })]
            })
          }), /* @__PURE__ */ jsx("tbody", {
            children: filteredOrders.map((order) => /* @__PURE__ */ jsxs("tr", {
              className: "hover:bg-gray-50",
              children: [/* @__PURE__ */ jsxs("td", {
                className: "border p-2",
                children: ["#", order.id]
              }), /* @__PURE__ */ jsx("td", {
                className: "border p-2",
                children: order.waiterId
              }), /* @__PURE__ */ jsx("td", {
                className: "border p-2",
                children: order.items.length
              }), /* @__PURE__ */ jsxs("td", {
                className: "border p-2",
                children: ["₹", calculateTotal(order.items)]
              }), /* @__PURE__ */ jsx("td", {
                className: "border p-2",
                children: getStatusBadge(order.status)
              }), /* @__PURE__ */ jsxs("td", {
                className: "border p-2 flex gap-2",
                children: [/* @__PURE__ */ jsxs("button", {
                  onClick: () => {
                    setSelectedOrder(order);
                    setShowModal(true);
                  },
                  className: "px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700",
                  children: [/* @__PURE__ */ jsx(FileText, {
                    className: "w-4 h-4"
                  }), " View"]
                }), /* @__PURE__ */ jsxs("button", {
                  onClick: () => {
                    printBill(order);
                  },
                  className: "px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700",
                  children: [/* @__PURE__ */ jsx(Printer, {
                    className: "w-4 h-4"
                  }), " Print"]
                })]
              })]
            }, order.id))
          })]
        })]
      })]
    }), /* @__PURE__ */ jsx(Dialog, {
      open: !!selectedOrder,
      onOpenChange: () => setSelectedOrder(null),
      children: /* @__PURE__ */ jsxs(DialogContent, {
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsxs(DialogTitle, {
            children: ["Order #", selectedOrder == null ? void 0 : selectedOrder.id]
          })
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Waiter:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.waiter]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Status:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.status]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Total Items:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.totalItems]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Total Amount:"
          }), " ₹", selectedOrder == null ? void 0 : selectedOrder.totalAmount]
        }), /* @__PURE__ */ jsxs("div", {
          className: "mt-4",
          children: [/* @__PURE__ */ jsx("h4", {
            className: "font-semibold mb-2",
            children: "Items:"
          }), /* @__PURE__ */ jsx("ul", {
            className: "space-y-1",
            children: (_a = selectedOrder == null ? void 0 : selectedOrder.items) == null ? void 0 : _a.map((item, index2) => /* @__PURE__ */ jsxs("li", {
              className: "flex justify-between border p-2 rounded-md",
              children: [/* @__PURE__ */ jsxs("span", {
                children: [item.name, " (", item.quantity, ")"]
              }), /* @__PURE__ */ jsxs("span", {
                children: ["₹", (item.price * item.quantity).toFixed(2)]
              })]
            }, index2))
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex gap-2 mt-4",
          children: [/* @__PURE__ */ jsx(Button, {
            variant: "destructive",
            onClick: () => handleDeleteOrder(selectedOrder.id),
            children: "Delete Order"
          }), (selectedOrder == null ? void 0 : selectedOrder.status) !== "completed" && /* @__PURE__ */ jsx(Button, {
            onClick: () => handleStatusUpdate(selectedOrder.id, "completed"),
            children: "Mark as Completed"
          }), (selectedOrder == null ? void 0 : selectedOrder.cashCollected) === false && /* @__PURE__ */ jsx(Button, {
            onClick: () => UpdateCash(selectedOrder.id),
            children: "Mark Cash Collected"
          })]
        })]
      })
    })]
  });
};
const index$1 = UNSAFE_withComponentProps(AdminDashboard);
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index$1
}, Symbol.toStringTag, { value: "Module" }));
const insights = UNSAFE_withComponentProps(function InsightsPage() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const COLORS = ["#4ade80", "#f87171", "#60a5fa", "#facc15", "#a78bfa"];
  const fetchInsights = async (start, end) => {
    try {
      const insightsData = await insightsAPI.getFullInsights(start, end);
      setData(insightsData);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchInsights();
  }, []);
  if (!data) return /* @__PURE__ */ jsx("p", {
    children: "Loading..."
  });
  const chartCards = [{
    title: "📦 Order Summary",
    type: "bar",
    dataKey: "count",
    data: data.orderSummary,
    xAxis: "status",
    fill: "#4ade80"
  }, {
    title: "💰 Revenue Over Time",
    type: "line",
    dataKey: "revenue",
    data: data.revenueOverTime,
    xAxis: "date",
    stroke: "#60a5fa"
  }, {
    title: "🍽️ Top Selling Items",
    type: "bar-vertical",
    dataKey: "sales",
    data: data.topSellingItems,
    xAxis: "item",
    fill: "#facc15"
  }, {
    title: "⏰ Peak Hours",
    type: "bar",
    dataKey: "orders",
    data: data.peakHours,
    xAxis: "hour",
    fill: "#a78bfa"
  }, {
    title: "👨‍🍳 Waiter Performance",
    type: "bar",
    dataKey: "orders",
    data: data.waiterPerformance,
    xAxis: "waiter",
    fill: "#f87171"
  }, {
    title: "📂 Most Ordered Categories",
    type: "pie",
    data: data.orderCategories,
    dataKey: "value",
    nameKey: "category"
  }, {
    title: "👥 Customer Retention",
    type: "pie",
    data: data.customerRetention,
    dataKey: "value",
    nameKey: "type",
    innerRadius: 60
  }];
  return /* @__PURE__ */ jsxs("div", {
    className: "p-6 space-y-6",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-2xl font-bold mb-4",
      children: "📊 Restaurant Insights"
    }), /* @__PURE__ */ jsxs("div", {
      className: "flex gap-4 items-end mb-6",
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("label", {
          className: "block text-sm font-medium",
          children: "Start Date"
        }), /* @__PURE__ */ jsx(Input, {
          type: "date",
          value: startDate,
          onChange: (e) => setStartDate(e.target.value)
        })]
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("label", {
          className: "block text-sm font-medium",
          children: "End Date"
        }), /* @__PURE__ */ jsx(Input, {
          type: "date",
          value: endDate,
          onChange: (e) => setEndDate(e.target.value)
        })]
      }), /* @__PURE__ */ jsx(Button, {
        onClick: () => fetchInsights(startDate, endDate),
        children: "Apply"
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
      children: chartCards.map((chart, index2) => /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: chart.title
        }), /* @__PURE__ */ jsx(CardContent, {
          style: {
            height: 300
          },
          children: /* @__PURE__ */ jsxs(ResponsiveContainer, {
            width: "100%",
            height: "100%",
            children: [chart.type === "bar" && /* @__PURE__ */ jsxs(BarChart, {
              data: chart.data,
              children: [/* @__PURE__ */ jsx(XAxis, {
                dataKey: chart.xAxis
              }), /* @__PURE__ */ jsx(YAxis, {}), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {}), /* @__PURE__ */ jsx(Bar, {
                dataKey: chart.dataKey,
                fill: chart.fill
              })]
            }), chart.type === "bar-vertical" && /* @__PURE__ */ jsxs(BarChart, {
              data: chart.data,
              layout: "vertical",
              children: [/* @__PURE__ */ jsx(XAxis, {
                type: "number"
              }), /* @__PURE__ */ jsx(YAxis, {
                dataKey: chart.xAxis,
                type: "category"
              }), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {}), /* @__PURE__ */ jsx(Bar, {
                dataKey: chart.dataKey,
                fill: chart.fill
              })]
            }), chart.type === "line" && /* @__PURE__ */ jsxs(LineChart, {
              data: chart.data,
              children: [/* @__PURE__ */ jsx(XAxis, {
                dataKey: chart.xAxis
              }), /* @__PURE__ */ jsx(YAxis, {}), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {}), /* @__PURE__ */ jsx(Line, {
                type: "monotone",
                dataKey: chart.dataKey,
                stroke: chart.stroke,
                strokeWidth: 2
              })]
            }), chart.type === "pie" && /* @__PURE__ */ jsxs(PieChart, {
              children: [/* @__PURE__ */ jsx(Pie, {
                data: chart.data,
                dataKey: chart.dataKey,
                nameKey: chart.nameKey,
                outerRadius: 100,
                innerRadius: chart.innerRadius || 0,
                label: true,
                children: chart.data.map((entry2, i) => /* @__PURE__ */ jsx(Cell, {
                  fill: COLORS[i % COLORS.length]
                }, i))
              }), /* @__PURE__ */ jsx(Tooltip, {}), /* @__PURE__ */ jsx(Legend, {})]
            })]
          })
        })]
      }, index2))
    })]
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: insights
}, Symbol.toStringTag, { value: "Module" }));
const menu$1 = UNSAFE_withComponentProps(function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    image: null
  });
  const fetchMenuItems = async () => {
    try {
      const items = await menuAPI.getAdmin();
      setMenuItems(items);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchMenuItems();
  }, []);
  const handleAddItem = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("price", newItem.price);
      formData.append("category", newItem.category);
      if (newItem.image) {
        formData.append("image", newItem.image);
      }
      const added = await menuAPI.create(formData);
      setMenuItems((prev) => [...prev, added]);
      setNewItem({
        name: "",
        price: "",
        category: "",
        image: null
      });
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };
  const toggleStock = async (id) => {
    try {
      await menuAPI.toggleAvailability(id.toString());
      setMenuItems((prev) => prev.map((item) => item.id === id ? {
        ...item,
        isAvailable: !item.isAvailable
      } : item));
    } catch (error) {
      console.error(error);
    }
  };
  const deleteItem = async (id) => {
    try {
      await menuAPI.delete(id.toString());
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex bg-gray-100",
    children: [/* @__PURE__ */ jsx(Header, {
      navigate
    }), /* @__PURE__ */ jsxs("div", {
      className: "p-6 space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold",
          children: "🍔 Menu Management"
        }), /* @__PURE__ */ jsx(Button, {
          onClick: () => setShowModal(true),
          children: "Add Item"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
        children: menuItems.map((item) => /* @__PURE__ */ jsx(Card, {
          className: "relative",
          children: /* @__PURE__ */ jsxs(CardContent, {
            children: [/* @__PURE__ */ jsx("img", {
              src: item.image,
              alt: item.name,
              className: "w-full h-40 object-cover rounded-md mb-4"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: item.name
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-sm text-gray-600",
              children: ["Category: ", item.category]
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-sm text-gray-600",
              children: ["Price: $", item.price.toFixed(2)]
            }), /* @__PURE__ */ jsx("p", {
              className: `text-sm font-medium ${item.isAvailable ? "text-green-600" : "text-red-600"}`,
              children: item.isAvailable ? "In Stock" : "Out of Stock"
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex gap-2 mt-3",
              children: [/* @__PURE__ */ jsx(Button, {
                size: "sm",
                onClick: () => toggleStock(item.id),
                children: item.isAvailable ? "Mark Out of Stock" : "Mark In Stock"
              }), /* @__PURE__ */ jsx(Button, {
                size: "sm",
                variant: "destructive",
                onClick: () => deleteItem(item.id),
                children: /* @__PURE__ */ jsx(Trash2, {
                  className: "w-4 h-4"
                })
              })]
            })]
          })
        }, item.id))
      }), showModal && /* @__PURE__ */ jsx("div", {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg max-w-lg w-full p-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between mb-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-xl font-bold",
              children: "Add New Menu Item"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setShowModal(false),
              children: /* @__PURE__ */ jsx(X, {
                className: "w-6 h-6 text-gray-500"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsx(Input, {
              placeholder: "Item Name",
              value: newItem.name,
              onChange: (e) => setNewItem({
                ...newItem,
                name: e.target.value
              })
            }), /* @__PURE__ */ jsx(Input, {
              placeholder: "Price",
              type: "number",
              value: newItem.price,
              onChange: (e) => setNewItem({
                ...newItem,
                price: e.target.value
              })
            }), /* @__PURE__ */ jsx(Input, {
              type: "file",
              onChange: (e) => {
                var _a;
                return setNewItem({
                  ...newItem,
                  image: ((_a = e.target.files) == null ? void 0 : _a[0]) || null
                });
              }
            }), /* @__PURE__ */ jsxs(Select, {
              value: newItem.category,
              onValueChange: (value) => setNewItem({
                ...newItem,
                category: value
              }),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Select Category"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "Starter",
                  children: "Starter"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Main",
                  children: "Main"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Dessert",
                  children: "Dessert"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Drink",
                  children: "Drink"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex justify-end gap-2",
              children: [/* @__PURE__ */ jsx(Button, {
                variant: "secondary",
                onClick: () => setShowModal(false),
                children: "Cancel"
              }), /* @__PURE__ */ jsx(Button, {
                onClick: handleAddItem,
                children: "Add Item"
              })]
            })]
          })]
        })
      })]
    })]
  });
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: menu$1
}, Symbol.toStringTag, { value: "Module" }));
const orders = UNSAFE_withComponentProps(function OrdersPage2() {
  var _a;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [orders2, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getOrdersByDate(startDate, endDate, status);
      setOrders(res);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const updatedOrder = await ordersAPI.updateStatus(orderId.toString(), newStatus);
      const updatedId = typeof updatedOrder.id === "string" ? parseInt(updatedOrder.id) : updatedOrder.id;
      setOrders((prev) => prev.map((order) => order.id === updatedId ? {
        ...order,
        status: updatedOrder.status
      } : order));
      setSelectedOrder((prev) => {
        if (!prev) return prev;
        const prevId = typeof prev.id === "string" ? parseInt(prev.id) : prev.id;
        return prevId === updatedId ? {
          ...prev,
          status: updatedOrder.status
        } : prev;
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };
  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await ordersAPI.delete(orderId.toString());
      setOrders((prev) => prev.filter((order) => order.id !== parseInt(orderId.toString())));
      setSelectedOrder(null);
    } catch (error) {
      console.error(error);
    }
  };
  const filteredOrders = orders2.filter((order) => {
    if (status && order.status !== status) return false;
    return true;
  });
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "flex",
    children: [/* @__PURE__ */ jsx(Header, {
      navigate
    }), /* @__PURE__ */ jsxs("main", {
      className: "flex-1 p-6 space-y-6",
      children: [/* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsx("h3", {
            className: "text-lg font-semibold",
            children: "Filter Orders"
          })
        }), /* @__PURE__ */ jsxs(CardContent, {
          className: "flex flex-wrap gap-4 items-end",
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Start Date"
            }), /* @__PURE__ */ jsx(Input, {
              type: "date",
              value: startDate,
              onChange: (e) => setStartDate(e.target.value)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "End Date"
            }), /* @__PURE__ */ jsx(Input, {
              type: "date",
              value: endDate,
              onChange: (e) => setEndDate(e.target.value)
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "text-sm font-medium",
              children: "Status"
            }), /* @__PURE__ */ jsxs(Select, {
              value: status,
              onValueChange: (val) => setStatus(val),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Select status"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "pending",
                  children: "Pending"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "preparing",
                  children: "Preparing"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "ready",
                  children: "Ready"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "completed",
                  children: "Completed"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "cancelled",
                  children: "Cancelled"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsx(Button, {
            onClick: fetchOrders,
            children: "Filter"
          })]
        })]
      }), /* @__PURE__ */ jsxs(Card, {
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsx("h3", {
            className: "text-lg font-semibold",
            children: "Orders"
          })
        }), /* @__PURE__ */ jsx(CardContent, {
          children: /* @__PURE__ */ jsxs("table", {
            className: "w-full border-collapse border border-gray-200",
            children: [/* @__PURE__ */ jsx("thead", {
              className: "bg-gray-100",
              children: /* @__PURE__ */ jsxs("tr", {
                children: [/* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Order ID"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Total Items"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Total Amount"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Waiter"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Status"
                }), /* @__PURE__ */ jsx("th", {
                  className: "border p-2 text-left",
                  children: "Actions"
                })]
              })
            }), /* @__PURE__ */ jsx("tbody", {
              children: filteredOrders.map((order) => /* @__PURE__ */ jsxs("tr", {
                className: "hover:bg-gray-50",
                children: [/* @__PURE__ */ jsx("td", {
                  className: "border p-2",
                  children: order.id
                }), /* @__PURE__ */ jsx("td", {
                  className: "border p-2",
                  children: order.totalItems
                }), /* @__PURE__ */ jsxs("td", {
                  className: "border p-2",
                  children: ["₹", order.totalAmount]
                }), /* @__PURE__ */ jsx("td", {
                  className: "border p-2",
                  children: order.waiter
                }), /* @__PURE__ */ jsx("td", {
                  className: "border p-2 capitalize",
                  children: order.status
                }), /* @__PURE__ */ jsxs("td", {
                  className: "border p-2 space-x-2",
                  children: [/* @__PURE__ */ jsx(Button, {
                    size: "sm",
                    variant: "outline",
                    onClick: () => setSelectedOrder(order),
                    children: "View"
                  }), /* @__PURE__ */ jsx(Button, {
                    size: "sm",
                    onClick: () => {
                      printBill(order);
                    },
                    children: "Print Bill"
                  })]
                })]
              }, order.id))
            })]
          })
        })]
      })]
    }), /* @__PURE__ */ jsx(Dialog, {
      open: !!selectedOrder,
      onOpenChange: () => setSelectedOrder(null),
      children: /* @__PURE__ */ jsxs(DialogContent, {
        children: [/* @__PURE__ */ jsx(CardHeader, {
          children: /* @__PURE__ */ jsxs(DialogTitle, {
            children: ["Order #", selectedOrder == null ? void 0 : selectedOrder.id]
          })
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Waiter:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.waiter]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Status:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.status]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Total Items:"
          }), " ", selectedOrder == null ? void 0 : selectedOrder.totalItems]
        }), /* @__PURE__ */ jsxs("p", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Total Amount:"
          }), " ₹", selectedOrder == null ? void 0 : selectedOrder.totalAmount]
        }), /* @__PURE__ */ jsxs("div", {
          className: "mt-4",
          children: [/* @__PURE__ */ jsx("h4", {
            className: "font-semibold mb-2",
            children: "Items:"
          }), /* @__PURE__ */ jsx("ul", {
            className: "space-y-1",
            children: (_a = selectedOrder == null ? void 0 : selectedOrder.items) == null ? void 0 : _a.map((item, index2) => /* @__PURE__ */ jsxs("li", {
              className: "flex justify-between border p-2 rounded-md",
              children: [/* @__PURE__ */ jsxs("span", {
                children: [item.name, " (", item.quantity, ")"]
              }), /* @__PURE__ */ jsxs("span", {
                children: ["₹", (item.price * item.quantity).toFixed(2)]
              })]
            }, index2))
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex gap-2 mt-4",
          children: [/* @__PURE__ */ jsx(Button, {
            variant: "destructive",
            onClick: () => handleDeleteOrder(selectedOrder.id),
            children: "Delete Order"
          }), (selectedOrder == null ? void 0 : selectedOrder.status) !== "completed" && /* @__PURE__ */ jsx(Button, {
            onClick: () => handleStatusUpdate(selectedOrder.id, "completed"),
            children: "Mark as Completed"
          })]
        })]
      })
    })]
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: orders
}, Symbol.toStringTag, { value: "Module" }));
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);
  const push = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{
      id,
      message
    }, ...t]);
    setTimeout(() => remove(id), 4e3);
  }, [remove]);
  return {
    toasts,
    push,
    remove
  };
}
function Toasts({
  toasts,
  onClose
}) {
  return /* @__PURE__ */ jsx("div", {
    className: "fixed top-4 right-4 z-[9999] space-y-2 w-[90vw] max-w-sm",
    children: toasts.map((t) => /* @__PURE__ */ jsx("div", {
      className: "bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700/50 cursor-pointer",
      onClick: () => onClose(t.id),
      role: "status",
      "aria-live": "polite",
      children: t.message
    }, t.id))
  });
}
const Menu = () => {
  const [menu2, setMenu] = useState([]);
  const [waiterId, setWaiterId] = useState();
  const [selected, setSelected] = useState({});
  const [tableNumber, setTableNumber] = useState();
  const [inputMethod, setInputMethod] = useState("menu");
  const [current_itemId, setCurrentItemId] = useState();
  const [itemQuantity, setItemQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const socketRef = useRef(null);
  const SOCKET_URL2 = api.defaults.baseURL || "http://localhost:3000";
  const {
    toasts,
    push,
    remove
  } = useToasts();
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuAPI.getAll();
        setMenu(data);
        const user = JSON.parse(localStorage.getItem("user"));
        setWaiterId(user.id);
      } catch (error) {
        console.error("Failed to load menu:", error);
      }
    };
    fetchMenu();
  }, []);
  useEffect(() => {
    if (waiterId !== void 0) {
      console.log(waiterId);
    }
  }, [waiterId]);
  useEffect(() => {
    const s = io(SOCKET_URL2, {
      transports: ["websocket"]
    });
    socketRef.current = s;
    s.on("OrderStatus", (payload) => {
      if (payload.waiterId === waiterId) {
        push(`Order #${payload.orderNumber} is ${payload.status}`);
      }
    });
    s.on("ItemStatus", (payload) => {
      if (payload.waiterId === waiterId) {
        push(`Order #${payload.orderNumber} - ${payload.name} is ${payload.status}`);
      }
    });
    return () => {
      s.disconnect();
    };
  }, [SOCKET_URL2, waiterId, push]);
  const addOrderItem = useCallback((itemId, itemQty, name, price, image) => {
    setOrderItems((prevItems) => {
      const index2 = prevItems.findIndex((item) => item.menuItemId === itemId);
      if (index2 !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[index2] = {
          ...updatedItems[index2],
          quantity: updatedItems[index2].quantity + itemQty
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          menuItemId: itemId,
          quantity: itemQty,
          name,
          price,
          image
        }];
      }
    });
  }, []);
  const previewItem = useMemo(() => {
    if (!current_itemId) return null;
    return menu2.find((obj) => obj.id === Number(current_itemId)) ?? null;
  }, [menu2, current_itemId]);
  const currentOrderTotal = useMemo(() => orderItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0), [orderItems]);
  const itemchng = (itemId) => {
    setCurrentItemId(Number(itemId));
  };
  const addItemById = () => {
    if (previewItem) {
      addOrderItem(previewItem.id, itemQuantity, previewItem.name, previewItem.price, previewItem.image);
    }
  };
  const removeFromCurrentOrder = (i) => {
    setOrderItems((items) => items.filter((_, index2) => index2 !== i));
  };
  const clearOrder = () => {
    setOrderItems([]);
  };
  const placeOrder = async () => {
    setPlacing(true);
    console.log(orderItems);
    try {
      await ordersAPI.create({
        items: orderItems,
        tableNumber,
        notes: ""
      });
      clearOrder();
      push("Order placed!");
    } catch (error) {
      console.error("Failed to place order:", error);
      push("Error placing order");
    } finally {
      setPlacing(false);
    }
  };
  useNavigate();
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx(Toasts, {
      toasts,
      onClose: remove
    }), /* @__PURE__ */ jsx("div", {
      className: "container mx-auto px-4 py-6",
      children: /* @__PURE__ */ jsxs("div", {
        className: "bg-white rounded-2xl shadow-lg p-6 mb-6",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-xl font-bold text-gray-800 mb-4",
          children: "Create New Order"
        }), /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
          children: /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              className: "block text-sm font-medium text-gray-700 mb-2",
              children: "Table Number"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: tableNumber ?? "",
              onChange: (e) => setTableNumber(parseInt(e.target.value)),
              className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: "Table #"
            })]
          })
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex space-x-4 mb-6",
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => setInputMethod("menu"),
            className: `px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "menu" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
            children: "Menu Selection"
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setInputMethod("id"),
            className: `px-6 py-3 rounded-lg font-medium transition-all duration-300 ${inputMethod === "id" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`,
            children: "ID Entry"
          })]
        }), inputMethod === "id" && /* @__PURE__ */ jsxs("div", {
          className: "bg-gray-50 rounded-lg p-6 mb-6",
          children: [/* @__PURE__ */ jsx("h3", {
            className: "text-lg font-semibold text-gray-800 mb-4",
            children: "Enter Item by ID"
          }), /* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-1 md:grid-cols-3 gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Item ID"
              }), /* @__PURE__ */ jsx("input", {
                type: "number",
                value: current_itemId ?? "",
                onChange: (e) => itemchng(e.target.value),
                className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                placeholder: "Enter ID (1-12)"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Quantity"
              }), /* @__PURE__ */ jsx("input", {
                type: "number",
                min: "1",
                value: itemQuantity,
                onChange: (e) => setItemQuantity(parseInt(e.target.value) || 1),
                className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "flex items-end",
              children: /* @__PURE__ */ jsx("button", {
                onClick: addItemById,
                className: "w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors",
                children: "Add Item"
              })
            })]
          }), previewItem && /* @__PURE__ */ jsx("div", {
            className: "mt-4",
            children: /* @__PURE__ */ jsxs("div", {
              className: "bg-white border rounded-lg p-3 flex items-center space-x-3",
              children: [/* @__PURE__ */ jsx("img", {
                src: previewItem.image,
                alt: previewItem.name,
                className: "w-16 h-16 object-cover rounded"
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("h4", {
                  className: "font-semibold",
                  children: previewItem.name
                }), /* @__PURE__ */ jsxs("p", {
                  className: "text-blue-600 font-bold",
                  children: ["₹", previewItem.price]
                })]
              })]
            })
          })]
        }), orderItems.length > 0 && /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-2xl shadow-lg p-6 mb-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex justify-between items-center mb-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-xl font-bold text-gray-800",
              children: "Current Order"
            }), /* @__PURE__ */ jsx("button", {
              onClick: clearOrder,
              className: "text-red-500 hover:text-red-700 font-medium",
              children: "Clear All"
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-3",
            children: orderItems.map((item, index2) => /* @__PURE__ */ jsx(CurrentOrderItem, {
              item,
              index: index2,
              onRemove: removeFromCurrentOrder
            }, item.menuItemId))
          }), /* @__PURE__ */ jsxs("div", {
            className: "border-t pt-4 mt-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center text-xl font-bold",
              children: [/* @__PURE__ */ jsx("span", {
                children: "Total"
              }), /* @__PURE__ */ jsxs("span", {
                children: ["₹", currentOrderTotal]
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: placeOrder,
              disabled: placing,
              className: "w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors",
              children: "Submit Order"
            })]
          })]
        }), inputMethod === "menu" && /* @__PURE__ */ jsx("div", {
          className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6",
          children: menu2.map((item) => /* @__PURE__ */ jsx(MenuItems, {
            item,
            additems: addOrderItem
          }, item.id))
        })]
      })
    })]
  });
};
const addOrder = UNSAFE_withComponentProps(Menu);
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: addOrder
}, Symbol.toStringTag, { value: "Module" }));
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
const AdminUsers = () => {
  const [users2, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "waiter",
    firstName: "",
    lastName: ""
  });
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }
  const path = api.defaults.baseURL;
  const fetchUsers = async () => {
    try {
      const res = await axios.get(path + "/auth/all", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const deleteUser = async (id) => {
    try {
      await axios.post(path + `/auth/${id}/delete`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(users2.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };
  const addUser = async () => {
    try {
      await axios.post(path + "/auth/register", form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOpen(false);
      setForm({
        username: "",
        password: "",
        role: "waiter",
        firstName: "",
        lastName: ""
      });
      fetchUsers();
    } catch (err) {
      console.error("Error adding user", err);
    }
  };
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    className: "min-h-screen flex bg-gray-100",
    children: [/* @__PURE__ */ jsx(Header, {
      navigate
    }), /* @__PURE__ */ jsxs("div", {
      className: "p-8 space-y-6",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "flex justify-between items-center",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold",
          children: "Account Management"
        }), /* @__PURE__ */ jsx(Button, {
          onClick: () => setOpen(true),
          children: "Add User"
        })]
      }), loading ? /* @__PURE__ */ jsx("p", {
        children: "Loading users..."
      }) : /* @__PURE__ */ jsxs(Table, {
        children: [/* @__PURE__ */ jsx(TableHeader, {
          children: /* @__PURE__ */ jsxs(TableRow, {
            children: [/* @__PURE__ */ jsx(TableHead, {
              children: "ID"
            }), /* @__PURE__ */ jsx(TableHead, {
              children: "Username"
            }), /* @__PURE__ */ jsx(TableHead, {
              children: "Role"
            }), /* @__PURE__ */ jsx(TableHead, {
              children: "Actions"
            })]
          })
        }), /* @__PURE__ */ jsx(TableBody, {
          children: users2.map((u) => /* @__PURE__ */ jsxs(TableRow, {
            children: [/* @__PURE__ */ jsx(TableCell, {
              children: u.id
            }), /* @__PURE__ */ jsx(TableCell, {
              children: u.username
            }), /* @__PURE__ */ jsx(TableCell, {
              children: u.role
            }), /* @__PURE__ */ jsx(TableCell, {
              children: /* @__PURE__ */ jsx(Button, {
                variant: "destructive",
                size: "sm",
                onClick: () => deleteUser(u.id),
                children: "Delete"
              })
            })]
          }, u.id))
        })]
      }), /* @__PURE__ */ jsx(Dialog, {
        open,
        onOpenChange: setOpen,
        children: /* @__PURE__ */ jsxs(DialogContent, {
          children: [/* @__PURE__ */ jsx(DialogHeader, {
            children: /* @__PURE__ */ jsx(DialogTitle, {
              children: "Add User"
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsx(Input, {
              placeholder: "Username",
              value: form.username,
              onChange: (e) => setForm({
                ...form,
                username: e.target.value
              })
            }), /* @__PURE__ */ jsx(Input, {
              type: "password",
              placeholder: "Password",
              value: form.password,
              onChange: (e) => setForm({
                ...form,
                password: e.target.value
              })
            }), /* @__PURE__ */ jsxs(Select, {
              value: form.role,
              onValueChange: (val) => setForm({
                ...form,
                role: val
              }),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Select role"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "waiter",
                  children: "Waiter"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "chef",
                  children: "Chef"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "admin",
                  children: "Admin"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsx(DialogFooter, {
            children: /* @__PURE__ */ jsx(Button, {
              onClick: addUser,
              children: "Save"
            })
          })]
        })
      })]
    })]
  });
};
const users = UNSAFE_withComponentProps(AdminUsers);
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: users
}, Symbol.toStringTag, { value: "Module" }));
const menu = UNSAFE_withComponentProps(function MenuManagement2() {
  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
    image: null
  });
  const fetchMenuItems = async () => {
    try {
      const items = await menuAPI.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchMenuItems();
  }, []);
  const toggleStock = async (id) => {
    try {
      await menuAPI.toggleAvailability(id.toString());
      setMenuItems((prev) => prev.map((item) => item.id === id ? {
        ...item,
        isAvailable: !item.isAvailable
      } : item));
    } catch (error) {
      console.error(error);
    }
  };
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsx(Header$1, {
      navigate
    }), /* @__PURE__ */ jsxs("div", {
      className: "p-6 space-y-6",
      children: [/* @__PURE__ */ jsx("div", {
        className: "flex justify-between items-center",
        children: /* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-bold",
          children: "🍔 Menu Management"
        })
      }), /* @__PURE__ */ jsx("div", {
        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
        children: menuItems.map((item) => /* @__PURE__ */ jsx(Card, {
          className: "relative",
          children: /* @__PURE__ */ jsxs(CardContent, {
            children: [/* @__PURE__ */ jsx("img", {
              src: item.image,
              alt: item.name,
              className: "w-full h-40 object-cover rounded-md mb-4"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: item.name
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-sm text-gray-600",
              children: ["Category: ", item.category]
            }), /* @__PURE__ */ jsxs("p", {
              className: "text-sm text-gray-600",
              children: ["Price: $", item.price.toFixed(2)]
            }), /* @__PURE__ */ jsx("p", {
              className: `text-sm font-medium ${item.isAvailable ? "text-green-600" : "text-red-600"}`,
              children: item.isAvailable ? "In Stock" : "Out of Stock"
            }), /* @__PURE__ */ jsx("div", {
              className: "flex gap-2 mt-3",
              children: /* @__PURE__ */ jsx(Button, {
                size: "sm",
                onClick: () => toggleStock(item.id),
                children: item.isAvailable ? "Mark Out of Stock" : "Mark In Stock"
              })
            })]
          })
        }, item.id))
      }), showModal && /* @__PURE__ */ jsx("div", {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        children: /* @__PURE__ */ jsxs("div", {
          className: "bg-white rounded-lg max-w-lg w-full p-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center justify-between mb-4",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-xl font-bold",
              children: "Add New Menu Item"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setShowModal(false),
              children: /* @__PURE__ */ jsx(X, {
                className: "w-6 h-6 text-gray-500"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsx(Input, {
              placeholder: "Item Name",
              value: newItem.name,
              onChange: (e) => setNewItem({
                ...newItem,
                name: e.target.value
              })
            }), /* @__PURE__ */ jsx(Input, {
              placeholder: "Price",
              type: "number",
              value: newItem.price,
              onChange: (e) => setNewItem({
                ...newItem,
                price: e.target.value
              })
            }), /* @__PURE__ */ jsx(Input, {
              type: "file",
              onChange: (e) => {
                var _a;
                return setNewItem({
                  ...newItem,
                  image: ((_a = e.target.files) == null ? void 0 : _a[0]) || null
                });
              }
            }), /* @__PURE__ */ jsxs(Select, {
              value: newItem.category,
              onValueChange: (value) => setNewItem({
                ...newItem,
                category: value
              }),
              children: [/* @__PURE__ */ jsx(SelectTrigger, {
                children: /* @__PURE__ */ jsx(SelectValue, {
                  placeholder: "Select Category"
                })
              }), /* @__PURE__ */ jsxs(SelectContent, {
                children: [/* @__PURE__ */ jsx(SelectItem, {
                  value: "Starter",
                  children: "Starter"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Main",
                  children: "Main"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Dessert",
                  children: "Dessert"
                }), /* @__PURE__ */ jsx(SelectItem, {
                  value: "Drink",
                  children: "Drink"
                })]
              })]
            })]
          })]
        })
      })]
    })]
  });
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: menu
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-C8Hg411F.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/index-C5gdAslh.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BsqRspyb.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/index-C5gdAslh.js"], "css": ["/assets/root-CLF0WI0z.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-C9_wBmme.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/auth-DCfcifDY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "/login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-_-nYnRJR.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/button-DQc83rjE.js", "/assets/card-CF0P5cGQ.js", "/assets/input-FauOGYKd.js", "/assets/index-BZlCCt0w.js", "/assets/index-C5gdAslh.js", "/assets/auth-DCfcifDY.js", "/assets/api-Cr5uWYEN.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/waiter/menu": { "id": "routes/waiter/menu", "parentId": "root", "path": "/waiter", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/menu-7V9jMk-w.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/api-Cr5uWYEN.js", "/assets/CurrentOrderItem-CTOLkoQ9.js", "/assets/Header-C2t_h_k6.js", "/assets/index-CA1CrNgP.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/waiter/Orders": { "id": "routes/waiter/Orders", "parentId": "root", "path": "/waiter/orders", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/Orders-DTbm88Bk.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/map-pin-1iWk_dRw.js", "/assets/api-Cr5uWYEN.js", "/assets/index-CA1CrNgP.js", "/assets/Header-C2t_h_k6.js", "/assets/createLucideIcon-DlhUvwdl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/chef/index": { "id": "routes/chef/index", "parentId": "root", "path": "/chef", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-D_7p67-I.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/index-CA1CrNgP.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/map-pin-1iWk_dRw.js", "/assets/api-Cr5uWYEN.js", "/assets/header-DfiKBqCc.js", "/assets/createLucideIcon-DlhUvwdl.js", "/assets/chevron-up-BUQweAlY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/index": { "id": "routes/admin/index", "parentId": "root", "path": "/admin", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/index-BT3aA7X1.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/api-Cr5uWYEN.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/dialog-B_vhg04E.js", "/assets/Header-DGBBqV3K.js", "/assets/index-CA1CrNgP.js", "/assets/printBill-DnXLfvfh.js", "/assets/createLucideIcon-DlhUvwdl.js", "/assets/Combination-Dov-rLQ-.js", "/assets/index-BZlCCt0w.js", "/assets/index-C5gdAslh.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/insights": { "id": "routes/admin/insights", "parentId": "root", "path": "/admin/insights", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/insights-DxTxqbX3.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/card-CF0P5cGQ.js", "/assets/input-FauOGYKd.js", "/assets/button-DQc83rjE.js", "/assets/api-Cr5uWYEN.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/menu": { "id": "routes/admin/menu", "parentId": "root", "path": "/admin/menu", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/menu-BMsTIXYm.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/input-FauOGYKd.js", "/assets/select-xCTCY9o9.js", "/assets/api-Cr5uWYEN.js", "/assets/Header-DGBBqV3K.js", "/assets/createLucideIcon-DlhUvwdl.js", "/assets/Combination-Dov-rLQ-.js", "/assets/index-C5gdAslh.js", "/assets/index-BZlCCt0w.js", "/assets/chevron-up-BUQweAlY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/orders": { "id": "routes/admin/orders", "parentId": "root", "path": "/admin/orders", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/orders-DZ1B_ZH-.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/input-FauOGYKd.js", "/assets/select-xCTCY9o9.js", "/assets/dialog-B_vhg04E.js", "/assets/api-Cr5uWYEN.js", "/assets/Header-DGBBqV3K.js", "/assets/printBill-DnXLfvfh.js", "/assets/index-C5gdAslh.js", "/assets/Combination-Dov-rLQ-.js", "/assets/createLucideIcon-DlhUvwdl.js", "/assets/index-BZlCCt0w.js", "/assets/chevron-up-BUQweAlY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/addOrder": { "id": "routes/admin/addOrder", "parentId": "root", "path": "/admin/addOrder", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/addOrder-QTjEJBfZ.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/api-Cr5uWYEN.js", "/assets/CurrentOrderItem-CTOLkoQ9.js", "/assets/index-CA1CrNgP.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/admin/users": { "id": "routes/admin/users", "parentId": "root", "path": "/admin/users", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/users-BSrV-IxX.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/api-Cr5uWYEN.js", "/assets/button-DQc83rjE.js", "/assets/dialog-B_vhg04E.js", "/assets/input-FauOGYKd.js", "/assets/select-xCTCY9o9.js", "/assets/Header-DGBBqV3K.js", "/assets/Combination-Dov-rLQ-.js", "/assets/createLucideIcon-DlhUvwdl.js", "/assets/index-BZlCCt0w.js", "/assets/index-C5gdAslh.js", "/assets/chevron-up-BUQweAlY.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/chef/menu": { "id": "routes/chef/menu", "parentId": "root", "path": "/chef/menu", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/menu-CcknqR7G.js", "imports": ["/assets/chunk-UH6JLGW7-DB7KfY1H.js", "/assets/card-CF0P5cGQ.js", "/assets/button-DQc83rjE.js", "/assets/input-FauOGYKd.js", "/assets/select-xCTCY9o9.js", "/assets/api-Cr5uWYEN.js", "/assets/header-DfiKBqCc.js", "/assets/Combination-Dov-rLQ-.js", "/assets/index-C5gdAslh.js", "/assets/index-BZlCCt0w.js", "/assets/chevron-up-BUQweAlY.js", "/assets/createLucideIcon-DlhUvwdl.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-9450d0cc.js", "version": "9450d0cc", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "/login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/waiter/menu": {
    id: "routes/waiter/menu",
    parentId: "root",
    path: "/waiter",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/waiter/Orders": {
    id: "routes/waiter/Orders",
    parentId: "root",
    path: "/waiter/orders",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/chef/index": {
    id: "routes/chef/index",
    parentId: "root",
    path: "/chef",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/admin/index": {
    id: "routes/admin/index",
    parentId: "root",
    path: "/admin",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/admin/insights": {
    id: "routes/admin/insights",
    parentId: "root",
    path: "/admin/insights",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/admin/menu": {
    id: "routes/admin/menu",
    parentId: "root",
    path: "/admin/menu",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/admin/orders": {
    id: "routes/admin/orders",
    parentId: "root",
    path: "/admin/orders",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/admin/addOrder": {
    id: "routes/admin/addOrder",
    parentId: "root",
    path: "/admin/addOrder",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/admin/users": {
    id: "routes/admin/users",
    parentId: "root",
    path: "/admin/users",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/chef/menu": {
    id: "routes/chef/menu",
    parentId: "root",
    path: "/chef/menu",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
