// onDragEnter sets inDropZone to true
export const handleDragEnter = (e, dispatch) => {
  e.preventDefault();
  e.stopPropagation();
  dispatch({ type: "SET_IN_DROP_ZONE", inDropZone: true });
};

// onDragLeave sets inDropZone to false
export const handleDragLeave = (e, dispatch) => {
  e.preventDefault();
  e.stopPropagation();

  dispatch({ type: "SET_IN_DROP_ZONE", inDropZone: false });
};

// onDragOver sets inDropZone to true
export const handleDragOver = (e, dispatch) => {
  e.preventDefault();
  e.stopPropagation();

  // set dropEffect to copy i.e copy of the source item
  e.dataTransfer.dropEffect = "copy";
  dispatch({ type: "SET_IN_DROP_ZONE", inDropZone: true });
};

// onDrop sets inDropZone to false and adds files to fileList
export const handleDrop = (e, data, dispatch, single) => {
  e.preventDefault();
  e.stopPropagation();

  // get files from event on the dataTransfer object as an array
  let files = [...e.dataTransfer.files];

  // WL: File type check only needed for drag and drop.
  files = files.filter((file) => {return ["png", "jpg", "jpeg"].includes(file.name.split(".").at(-1))})

  // ensure a file or files are dropped
  if (files && files.length > 0) {
    // WL: Removing checks on existing files. 
    // WL: New uploads to completely overwrite existing files.
    // // loop over existing files
    // const existingFiles = data.fileList.map((f) => f.name);
    // // check if file already exists, if so, don't add to fileList
    // // this is to prevent duplicates
    // files = files.filter((f) => !existingFiles.includes(f.name));

    if (single) {
      dispatch({ type: "ADD_FILE", file: files[0] });
    } else {
      // dispatch action to add droped file or files to fileList
      dispatch({ type: "ADD_FILE_TO_LIST", files });
    }
    // reset inDropZone to false
    dispatch({ type: "SET_IN_DROP_ZONE", inDropZone: false });
  }
};

// handle file selection via input element
export const handleFileSelect = (e, data, dispatch, single) => {
  // get files from event on the input element as an array
  let files = [...e.target.files];

  // WL: File type check not needed for input.
  // WL: File type check done in input HTML tag.
  // files = files.filter((file) => {return ["png", "jpg", "jpeg"].includes(file.name.split(".").at(-1))})

  // ensure a file or files are selected
  if (files && files.length > 0) {
    // WL: Removing checks on existing files. 
    // WL: New uploads to completely overwrite existing files.
    // // loop over existing files
    // const existingFiles = data.fileList.map((f) => f.name);
    // // check if file already exists, if so, don't add to fileList
    // // this is to prevent duplicates
    // files = files.filter((f) => !existingFiles.includes(f.name));

    // dispatch action to add selected file or files to fileList
    if (single) {
      dispatch({ type: "ADD_FILE", file: files[0] });
    } else {
      // dispatch action to add droped file or files to fileList
      dispatch({ type: "ADD_FILE_TO_LIST", files });
    }
  }
};