import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';

const AdminDashboard = ({ db, isAdmin }) => {
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [series, setSeries] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleAddCar = async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'You are not authorized to perform this action.' });
            return;
        }
        if (!name || !image || !series) {
            setMessage({ type: 'error', text: 'Please fill out all fields.' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const carsCollectionRef = collection(db, 'cars');
            await addDoc(carsCollectionRef, {
                name: name,
                image: image,
                series: series
            });

            setMessage({ type: 'success', text: `Successfully added "${name}" to the database!` });
            
            // Clear the form fields
            setName('');
            setImage('');
            setSeries('');

        } catch (error) {
            setMessage({ type: 'error', text: `Error adding car: ${error.message}` });
            console.error("Error adding document: ", error);
        } finally {
            setIsSubmitting(false);
            // Clear the message after 5 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };
    
    return (
        <div className="bg-base-300 rounded-lg shadow-xl p-8 w-full">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="border-t border-base-100 pt-6">
                <h2 className="text-xl font-semibold mb-4">Add a New Car</h2>
                <form onSubmit={handleAddCar} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Car Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input input-bordered w-full"
                    />
                    <input 
                        type="text" 
                        placeholder="Image URL" 
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="input input-bordered w-full"
                    />
                    <input 
                        type="text" 
                        placeholder="Car Series" 
                        value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        className="input input-bordered w-full"
                    />
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                        {isSubmitting ? <span className="loading loading-spinner"></span> : 'Add Car to Database'}
                    </button>
                </form>
                {message.text && (
                    <div className={`mt-4 text-center p-2 rounded-md ${message.type === 'success' ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

