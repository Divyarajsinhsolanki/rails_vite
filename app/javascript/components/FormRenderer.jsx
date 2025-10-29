import React from "react";
import FormComponent from "./FormComponent";
import { getToolById } from "../utils/pdfToolsConfig";

const FormRenderer = ({ activeForm, setActiveForm, setPdfUpdated, pdfPath }) => {
  const config = getToolById(activeForm);

  if (!config) return null;

  return (
    <FormComponent
      setActiveForm={setActiveForm}
      setPdfUpdated={setPdfUpdated}
      pdfPath={pdfPath}
      {...config}
    />
  );
};

export default FormRenderer;
