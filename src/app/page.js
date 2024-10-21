'use client';

import React, { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [testFileURL, setTestFileURL] = useState(null); // To store the image URL
  const [personName, setPersonName] = useState('');
  const [option, setOption] = useState('');
  const [message, setMessage] = useState('');
  const [caption, setCaption] = useState('');

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);
  const handleTestFileChange = (e) => {
    const file = e.target.files[0];
    setTestFile(file);
    setTestFileURL(URL.createObjectURL(file)); // Generate a local URL to display the image
  };
  const handleNameChange = (e) => setPersonName(e.target.value);
  const handleOptionChange = (e) => setOption(e.target.value);

  const uploadImages = async () => {
    if (!selectedFile || !option) {
      alert('Please select a file and an option.');
      return;
    }
    if (option === 'train' && !personName) {
      alert('Please provide a person name for training.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('option', option);
    formData.append('personName', personName);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setMessage(data.message);
  };

  const uploadTestImage = async () => {
    if (!testFile) {
      alert('Please select a test image.');
      return;
    }
    const formData = new FormData();
    formData.append('file', testFile);
    const res = await fetch('/api/recognize', { method: 'POST', body: formData });
    const data = await res.json();
    setMessage(data.message);
    if (data.message) setCaption(data.message);
  };

  const formatCaption = (caption) => {
    const parts = caption.split('Final Caption:');
    return (
      <>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Generated Caption:</h3>
        <p className="text-gray-700 mb-8 leading-relaxed">{parts[0].trim()}</p>
        <h4 className="text-lg font-bold text-gray-800 mb-4">Final Caption:</h4>
        <p className="text-gray-700 leading-relaxed">{parts[1].trim()}</p>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">OSAAT</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Upload Image for Training</h2>
              <div className="space-y-4">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {option === 'train' && (
                  <input 
                    type="text" 
                    placeholder="Person's Name" 
                    value={personName} 
                    onChange={handleNameChange} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-gray-700"
                  />
                )}
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="option" 
                      value="train" 
                      onChange={handleOptionChange} 
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Train</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="option" 
                      value="generate" 
                      onChange={handleOptionChange} 
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Generate Caption</span>
                  </label>
                </div>
                <button 
                  onClick={uploadImages} 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                >
                  Submit Training Image
                </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Upload Image for Recognition</h2>
              <div className="space-y-4">
                <input 
                  type="file" 
                  onChange={handleTestFileChange} 
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                />
                {testFileURL && (
                  <img 
                    src={testFileURL} 
                    alt="Uploaded Test Image" 
                    className="w-full h-auto mt-4 rounded-md border border-gray-300"
                  />
                )}
                <button 
                  onClick={uploadTestImage} 
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                >
                  Generate Caption from Test Image
                </button>
              </div>
            </section>

            {caption && (
              <div className="mt-6 p-6 bg-gray-50 rounded-md border border-gray-200 shadow-sm">
                {formatCaption(caption)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}