import React from 'react';
import { useParams } from 'react-router-dom';

export default function PrintableCertificatePage() {
    const { id } = useParams();

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Printable Certificate Page</h1>
                <p className="text-slate-600">Certificate ID: {id}</p>
            </div>
        </div>
    );
}