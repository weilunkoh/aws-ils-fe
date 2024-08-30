export const format_timestamp_ms = (timestamp_ms) => {
  // Check if "_'" is in the timestamp_ms string
  if (String(timestamp_ms).includes("_")) {
    // Split the string by "_"
    const split_timestamp_ms = timestamp_ms.split("_");
    const timestamp_ms_int = parseInt(split_timestamp_ms[0]);

    // Return the formatted timestamp
    return format_timestamp_ms_int(timestamp_ms_int) + " (" + split_timestamp_ms[1] + ")"
  } else {
    // Return the formatted timestamp
    return format_timestamp_ms_int(timestamp_ms)
  }
};

const format_timestamp_ms_int = (timestamp_ms) => {
  const date_object = new Date(timestamp_ms)
  return date_object.getDate().toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + "/" +
    (date_object.getMonth() + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + "/" +
    date_object.getFullYear() + " " +
    date_object.toLocaleTimeString()
};
