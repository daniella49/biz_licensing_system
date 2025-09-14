import { useState } from "react";
import axios from "axios";
import "./index.css";

export default function App() {
  const [form, setForm] = useState({
    area: "",
    seats: "",
    serves_meat: false,
    deliveries: false,
  });

  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport("");

    try {
      const res = await axios.post("http://localhost:3000/api/generate-report", form);
      if (res.data.ok) setReport(res.data.report);
      else setError("שגיאה ביצירת הדו\"ח");
    } catch (err) {
      setError(err.message || "שגיאת שרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="w-full max-w-lg bg-white p-10 rounded-3xl shadow-2xl border border-gray-200" dir="rtl">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-blue-700">
          דו"ח דרישות רישוי לעסק
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Area */}
          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700">שטח (מ"ר)</label>
            <input
              type="number"
              name="area"
              value={form.area}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="הזן את שטח העסק"
              required
            />
          </div>

          {/* Seats */}
          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700">מספר מושבים</label>
            <input
              type="number"
              name="seats"
              value={form.seats}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="הזן מספר מושבים"
              required
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col space-y-3">
            <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                name="serves_meat"
                checked={form.serves_meat}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">הגשת בשר</span>
            </label>

            <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                name="deliveries"
                checked={form.deliveries}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">משלוחים</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            disabled={loading}
          >
            {loading ? "יוצר דו\"ח..." : "צור דו\"ח"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-100 border border-red-300 text-red-700 font-semibold text-center shadow-inner">
            {error}
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="mt-6 p-5 rounded-xl bg-gray-50 border border-gray-200 shadow-inner whitespace-pre-line break-words leading-relaxed text-gray-800">
            {report}
          </div>
        )}
      </div>
    </div>
  );
}