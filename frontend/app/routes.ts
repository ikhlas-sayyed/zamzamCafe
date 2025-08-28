import { type RouteConfig, index ,route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route('/login','routes/login.tsx'),
    route('/waiter','routes/waiter/menu.tsx'),
    route('/waiter/orders','routes/waiter/Orders.tsx'),
    route('/chef','routes/chef/index.tsx'),
    route('/admin','routes/admin/index.tsx'),
    route('/admin/insights','routes/admin/insights.tsx'),
    route('/admin/menu','routes/admin/menu.tsx'),
    route('/admin/orders','routes/admin/orders.tsx'),
    route('/admin/addOrder','routes/admin/addOrder.tsx'),
] satisfies RouteConfig;
