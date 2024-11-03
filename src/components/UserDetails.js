import React, { useState } from "react";
const UserDetailsCard = ({ onSubmit, isOpen }) => {
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

  return <div>UserDetailsCard</div>;
};

export default UserDetailsCard;
