sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("massuploadexcel.controller.uploadView", {
        onInit() {
        },
        onFileChange(oEvent) {
            console.log("on Filechange Triggered")
            const aFiles = oEvent.getParameter("files");
            if (aFiles && aFiles.length > 0) {
                this._oFiles = aFiles[0];
                console.log("Selected Files: ", this._oFiles);
            }
            else {
                this._oFiles = null;
                console.log("no FIles Uploded");

            }
        },
        onUploadStudents() {
            if (!this._oFiles) {
                MessageToast.show("Please Select a file");
                return;
            }
            const oReader = new FileReader();
            const that = this;
            oReader.readAsDataURL(this._oFiles);
            oReader.onload = function (e) {
                const sFileTarget = e.target.result;
                console.log("File Content ", sFileTarget);
                $.ajax({
                    url: '/odata/v4/students/uploadStudentExcel',
                    method: 'POST',
                    contentType: "application/json",
                    data: JSON.stringify({ file: sFileTarget }),
                    success: function (data) {
                        MessageToast.show("uploaded sucessfully");
                    },
                    error: function (error) {
                        MessageToast.show("File Uploaded Failed");
                        console.error("upload error form backend: ", error)
                    }
                })
            }
        },
        onUploadusingContext: async function () {

            if (!this._oFiles) {
                sap.m.MessageToast.show("Please select a file");
                return;
            }

            // Read file as Base64
            const oReader = new FileReader();
            const that = this;

            oReader.onload = async function (e) {
                const sFileTarget = e.target.result; // Base64 content

                console.log("File Content:", sFileTarget);

                // Get OData V4 model
                const oModel = that.getView().getModel();

                // Create action binding → UNBOUND action
                const oAction = oModel.bindContext("/uploadStudentExcel(...)");

                // Pass parameter to CAP action
                oAction.setParameter("file", sFileTarget);

                try {
                    // Execute action
                    await oAction.execute();

                    // Read result from CAP handler
                    const oResult = await oAction.requestObject();
                    console.log("Response from CAP:", oResult);

                    sap.m.MessageToast.show("Uploaded successfully");
                } catch (oError) {
                    console.error("Upload failed:", oError);
                    sap.m.MessageBox.error("File upload failed");
                }
            };

            // START reading file
            oReader.readAsDataURL(this._oFiles);

        }
    });
});