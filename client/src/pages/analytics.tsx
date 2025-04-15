import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  CartesianGrid
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data for charts
const coursesData = [
  { name: "Обслуживание номеров", count: 28, color: "#1E88E5" },
  { name: "Ресторан", count: 42, color: "#26A69A" },
  { name: "Ресепшн", count: 35, color: "#FF8A65" },
  { name: "Уборка", count: 20, color: "#7986CB" },
];

const departmentCompletionData = [
  { name: "Обсл. номеров", completed: 86, total: 100 },
  { name: "Ресторан", completed: 92, total: 100 },
  { name: "Ресепшн", completed: 75, total: 100 },
  { name: "Уборка", completed: 65, total: 100 },
];

const monthlyCompletionData = [
  { name: "Янв", completions: 24 },
  { name: "Фев", completions: 18 },
  { name: "Мар", completions: 32 },
  { name: "Апр", completions: 27 },
  { name: "Май", completions: 45 },
  { name: "Июн", completions: 38 },
];

export default function Analytics() {
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Аналитика" />
      
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="courses">Курсы</TabsTrigger>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Распределение курсов по отделам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={coursesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {coursesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Department Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Процент завершения по отделам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentCompletionData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, "Завершено"]}
                        labelFormatter={(value) => `Отдел: ${value}`}
                      />
                      <Bar 
                        dataKey="completed" 
                        fill="#1E88E5" 
                        background={{ fill: "#eee" }}
                        label={{ position: "right", formatter: (value) => `${value}%` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Completions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Завершенные курсы по месяцам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyCompletionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completions" 
                        stroke="#1E88E5" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="courses" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Эта функциональность находится в разработке</p>
          </div>
        </TabsContent>
        
        <TabsContent value="employees" className="mt-4">
          <div className="text-center py-12 text-neutral-500">
            <p>Эта функциональность находится в разработке</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
