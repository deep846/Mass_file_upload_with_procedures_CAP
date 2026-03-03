const xlsx = require('xlsx');

async function onReadCustomer(req,next){
    const data = await next();
    console.log(data);
    console.log("Yaa hoooo!!!!!");
}

async function uploadStudentExcel(req) {
    console.log("File Upload Triggered");
    const {students} = this.entities;

    try{
        const filecontent = req.data.file.split(',')[1];
        const binaryString = Buffer.from(filecontent, 'base64').toString('binary');
        const bytes = new Uint8Array(binaryString.length);

        for(let i=0; i<binaryString.length; i++){
            bytes[i] = binaryString.charCodeAt(i);
        }

        const workbook = xlsx.read(bytes.buffer, {type: 'array'});
        const SheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[SheetName];
        const StudentsData = xlsx.utils.sheet_to_json(sheet);

        console.log('parsed data:  ',StudentsData);

        const FormattedStudentsData = StudentsData.map(record=>({
            ...record
        }));

        await INSERT.into(students).entries(FormattedStudentsData);

        return {message: "File Uploaded successfully"};




    }
    catch(e){
        console.log("Error During upload",e);
        return req.error(400,'Invalid file content');

    }
    
}

module.exports = {onReadCustomer,uploadStudentExcel}
