const cds = require('@sap/cds');
const customStudentHandler = require('../studentBuisnessLogic/studentBuisnesslogic')

class StudentsService extends cds.ApplicationService {
    
    init(){
        const {students} = this.entities;
        this.on('READ',students,customStudentHandler.onReadCustomer);
        this.on('uploadStudentExcel',customStudentHandler.uploadStudentExcel);
        return super.init();
    }

}


module.exports = {StudentsService}