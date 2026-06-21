import NepalMap from "./NepalMap";

import provinceData from "./nepal-province";
import province_1 from "./province1-district";
import province_2 from "./province2-district";
import province_3 from "./province3-district";
import province_4 from "./province4-district";
import province_5 from "./province5-district";
import province_6 from "./province6-district";
import province_7 from "./province7-district";

const districtData = {
  1: province_1,
  2: province_2,
  3: province_3,
  4: province_4,
  5: province_5,
  6: province_6,
  7: province_7,
};

async function fetchDistrict(districtName) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/districts/name/${districtName}`
    );

    const json = await res.json();

    return json.data;
  } catch (err) {
    console.error(err);
    return {
      error: "Failed to load district data",
    };
  }
}

export default function App() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>Nepal Development Dashboard</h1>

      <NepalMap
        provinceData={provinceData}
        districtData={districtData}
        onDistrictClick={fetchDistrict}
      />
    </div>
  );
}