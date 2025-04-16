import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';

export default function StorageTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Загрузка списка файлов при монтировании
  useEffect(() => {
    fetchFiles();
  }, []);

  // Получение списка файлов
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media/list');
      if (!response.ok) {
        throw new Error(`Ошибка получения списка файлов: ${response.status}`);
      }
      const files = await response.json();
      setUploadedFiles(files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setMessage('Ошибка при загрузке списка файлов');
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Загрузка файла
  const handleUpload = async () => {
    if (!file) {
      setMessage('Пожалуйста, выберите файл для загрузки');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedById', '1'); // Используем ID администратора по умолчанию

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }

      const result = await response.json();
      setMessage(`Файл успешно загружен: ${result.originalFilename}`);
      setFile(null);
      
      // Обновляем список файлов
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage(`Ошибка при загрузке файла: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  // Удаление файла
  const handleDelete = async (id: number) => {
    try {
      setMessage('');
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
      }

      setMessage('Файл успешно удален');
      // Обновляем список файлов
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage(`Ошибка при удалении файла: ${error}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Тестирование Replit Object Storage</h1>
      
      {message && (
        <div className="mb-4 p-4 rounded-md bg-blue-50 text-blue-700">
          {message}
        </div>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Загрузка файла</CardTitle>
          <CardDescription>Выберите файл для загрузки в Replit Object Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file">Файл</Label>
            <Input 
              id="file" 
              type="file" 
              onChange={handleFileChange} 
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-gray-500 mt-1">
                Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? 'Загрузка...' : 'Загрузить файл'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Загруженные файлы</CardTitle>
          <CardDescription>Список файлов в Object Storage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Загрузка списка файлов...</p>
          ) : uploadedFiles.length > 0 ? (
            <div className="grid gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border rounded-md p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{file.name || file.originalFilename}</h3>
                    <p className="text-sm text-gray-500">
                      {file.mediaType} • {(file.fileSize / 1024).toFixed(2)} KB
                    </p>
                    {file.url && (
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Просмотреть файл
                      </a>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(file.id)}
                  >
                    Удалить
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p>Нет загруженных файлов</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={fetchFiles} disabled={loading}>
            Обновить список
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}