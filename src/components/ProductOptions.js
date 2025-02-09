'use client';

export default function ProductOptions({ name, values, selected, onChange }) {
  // Just capitalize the first letter
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        {displayName}
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
      >
        <option value="">Select {displayName}</option>
        {values.map((value) => (
          <option key={value} value={value} className="bg-gray-800">
            {value.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
