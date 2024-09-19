import React, { useState } from "react";

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    
  },
  heading: {
    color: "green",
    textAlign: "center",
  },
  radioButton: {
    padding: "12px 16px",
    borderRadius: "8px",
    margin: "8px",
    border: "2px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20%",
    cursor: "pointer",
    transition: "background-color 0.3s, color 0.3s",
    zIndex: "10000",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)"
},
  selected: {
    background: "#6EA8D7",
    color: "#fff",
  },
};

const CustomRadioButton = ({ label, selected, onSelect }) => (
  <button
    style={{
      ...styles.radioButton,
      ...(selected ? styles.selected : {}),
    }}
    onClick={onSelect}
  >
    {label}
  </button>
);

export default CustomRadioButton;
