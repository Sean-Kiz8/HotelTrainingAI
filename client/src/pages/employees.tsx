import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageHeader, SearchInput, CreateButton } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { AssignCourseDialog } from "@/components/employees/assign-course-dialog";
import { AssignAssessmentDialog } from "@/components/employees/assign-assessment-dialog";

export default function Employees() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showAssignCourseDialog, setShowAssignCourseDialog] = useState(false);
  const [showAssignAssessmentDialog, setShowAssignAssessmentDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Generate stable progress values for each employee
  const employeeProgressMap = useMemo(() => {
    if (!users) return new Map();

    const progressMap = new Map();
    users.forEach((user: any) => {
      // Generate a stable random value based on user ID
      // This ensures the same user always gets the same progress value
      const hash = hashCode(user.id);
      const progress = Math.abs(hash % 101); // Value between 0-100
      progressMap.set(user.id, progress);
    });

    return progressMap;
  }, [users]);

  // Simple string hash function
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // Filter out admin users and filter by search query
  const employees = users?.filter((user: any) =>
    user.role !== "admin" &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.position?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <PageHeader title="Сотрудники">
        <SearchInput
          placeholder="Поиск сотрудников..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <CreateButton
          label="Добавить сотрудника"
          onClick={() => setShowAddEmployeeDialog(true)}
        />

        {/* Диалоговое окно добавления сотрудника */}
        <AddEmployeeDialog
          open={showAddEmployeeDialog}
          onOpenChange={setShowAddEmployeeDialog}
        />

        {/* Диалоговое окно назначения курса */}
        {selectedEmployee && (
          <AssignCourseDialog
            open={showAssignCourseDialog}
            onOpenChange={setShowAssignCourseDialog}
            employeeId={selectedEmployee.id}
            employeeName={selectedEmployee.name}
          />
        )}

        {/* Диалоговое окно назначения ассесмента */}
        {selectedEmployee && (
          <AssignAssessmentDialog
            open={showAssignAssessmentDialog}
            onOpenChange={setShowAssignAssessmentDialog}
            employeeId={selectedEmployee.id}
            employeeName={selectedEmployee.name}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))
        ) : (
          <>
            {employees && employees.length > 0 ? (
              employees.map((employee: any) => (
                <Card key={employee.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center">
                      <Avatar className="h-12 w-12 mr-3">
                        <AvatarImage src={employee.avatar || ""} alt={employee.name} />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{employee.name}</h3>
                        <p className="text-sm text-neutral-500">{employee.position || "Не указано"}</p>
                        {employee.department && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {employee.department}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-neutral-500">Прогресс обучения</span>
                        <span className="text-xs font-medium">
                          {employeeProgressMap.get(employee.id) || 0}%
                        </span>
                      </div>
                      <Progress value={employeeProgressMap.get(employee.id) || 0} className="h-1" />

                      <div className="flex justify-between mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate(`/employee-profile/${employee.id}`)}
                        >
                          Профиль
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowAssignCourseDialog(true);
                            }}
                          >
                            Назначить курс
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowAssignAssessmentDialog(true);
                            }}
                          >
                            Назначить ассесмент
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-neutral-500">
                {searchQuery ? (
                  <p>Сотрудники по запросу "{searchQuery}" не найдены</p>
                ) : (
                  <p>Нет сотрудников в системе</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
