const xlsx = require('xlsx');

async function onReadCustomer(req, next) {
    const data = await next();
    console.log(data);
    console.log("Yaa hoooo!!!!!");
}

async function uploadStudentExcel(req) {
    console.log("File Upload Triggered");
    const { students } = this.entities;

    try {
        const filecontent = req.data.file.split(',')[1];

        // 1st way that we have done on 1st lession
        // const binaryString = Buffer.from(filecontent, 'base64').toString('binary');
        // const bytes = new Uint8Array(binaryString.length);

        // for(let i=0; i<binaryString.length; i++){
        //     bytes[i] = binaryString.charCodeAt(i);
        // }

        // 2nd way we are doing it

        const buffer = Buffer.from(filecontent, 'base64');



        // 1st way to do it
        // const workbook = xlsx.read(bytes.buffer, {type: 'array'});

        // 2nd way to do it
        const workbook = xlsx.read(buffer.buffer, { type: 'array' });


        const SheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[SheetName];
        const StudentsData = xlsx.utils.sheet_to_json(sheet);

        console.log('parsed data:  ', StudentsData);

        const FormattedStudentsData = StudentsData.map(record => ({
            ...record
        }));

        // 1st way to do it
        // await INSERT.into(students).entries(FormattedStudentsData);

        // 2nd way to do it via procedure. MASS UPLOADING via procedure.
        for (const student of FormattedStudentsData) {
            const { ID, Name, Roll, Class } = student;
            //this one is also okay 
            await cds.run(`CALL "8CC23DED985F4A2F8B315F68F418EBE4"."pro"('${ID}','${Name}','${Roll}','${Class}')`)
            // this one is also okay.
            // await cds.run(
            //     `CALL "8CC23DED985F4A2F8B315F68F418EBE4"."pro"(?,?,?,?)`,
            //     [ID, Name, Roll, Class]
            // );
        }

        return { message: "File Uploaded successfully" };




    }
    catch (e) {
        console.log("Error During upload", e);
        return req.error(400, 'Invalid file content');

    }

}

module.exports = { onReadCustomer, uploadStudentExcel }
