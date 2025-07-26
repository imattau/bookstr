import { useParams } from 'react-router-dom';

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Reader Page</h1>
      <p>Book ID: {bookId}</p>
    </div>
  );
}
