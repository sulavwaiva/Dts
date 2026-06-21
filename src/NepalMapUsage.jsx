import NepalMap from "./NepalMap";

// Step 1: Import your existing JS data files
// These are the same variables from your original HTML — just export them.
import provinceData from "./nepal-province";       // your provinceData variable
import province_1 from "./province1-district";     // province_1 variable
import province_2 from "./province2-district";
import province_3 from "./province3-district";
import province_4 from "./province4-district";
import province_5 from "./province5-district";
import province_6 from "./province6-district";
import province_7 from "./province7-district";

// Step 2: Bundle district data by province number
const districtData = {
  1: province_1,
  2: province_2,
  3: province_3,
  4: province_4,
  5: province_5,
  6: province_6,
  7: province_7,
};

// Step 3: Optional — fetch district details from your API
async function fetchDistrict(districtName) {
  const res = await fetch(`http://localhost:3000/api/districts/name/${districtName}`);
  const json = await res.json();
  return json.data; // { district_name, province, total_population, no_of_female, no_of_male }
}

export default function App() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Nepal Map</h1>
      <NepalMap
        provinceData={provinceData}
        districtData={districtData}
        onDistrictClick={fetchDistrict}   // remove this prop if you don't have an API
      />
    </div>
  );
}
