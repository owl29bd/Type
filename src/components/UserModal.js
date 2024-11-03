import React, { useState } from "react";
const UserModal = ({ onSubmit, isOpen }) => {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    registrationNumber: "",
  });

  // Add this array of departments
  const departments = [
    "Computer Science and Engineering",
    "Electrical and Electronic Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Architecture",
    "Urban and Regional Planning",
    "Chemical Engineering",
    "Materials and Metallurgical Engineering",
    "Industrial and Production Engineering",
    "Water Resources Engineering",
    "Naval Architecture and Marine Engineering",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-96">
        <h2 className="text-2xl text-white mb-6">Enter Your Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-white mb-2">Department</label>
            <select
              required
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.department}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, department: e.target.value }))
              }
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mb-2">Registration Number</label>
            <input
              type="text"
              required
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registrationNumber: e.target.value,
                }))
              }
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Start Test
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
