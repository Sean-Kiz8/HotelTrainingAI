// Learning Path utility functions

export const getLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'junior':
      return 'green';
    case 'middle':
      return 'blue';
    case 'senior':
      return 'purple';
    default:
      return 'gray';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'green';
    case 'completed':
      return 'blue';
    case 'pending':
      return 'yellow';
    default:
      return 'gray';
  }
}; 