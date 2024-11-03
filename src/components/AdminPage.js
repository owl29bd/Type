import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminPage = () => {
  const [halfTime, setHalfTime] = useState(120);
  const [breakTime, setBreakTime] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const backendUrl = process.env.REACT_APP_API_URL;

  console.log("backendUrl:", backendUrl);

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const response = await axios.get(`${backendUrl}/settings`);
      setHalfTime(response.data.halfTime || 120);
      setBreakTime(response.data.breakTime || 30);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      await axios.post(`${backendUrl}/settings`, {
        halfTime: parseInt(halfTime),
        breakTime: parseInt(breakTime),
      });
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl text-white font-bold mb-6">Admin Settings</h1>

        <form onSubmit={handleSaveSettings}>
          <div className="mb-4">
            <label className="block text-white mb-2">
              Half Time (seconds):
            </label>
            <input
              type="number"
              value={halfTime}
              onChange={(e) => setHalfTime(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded"
              min="1"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2">
              Break Time (seconds):
            </label>
            <input
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded"
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>

          {saveMessage && (
            <p
              className={`mt-4 text-center ${
                saveMessage.includes("Error")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
