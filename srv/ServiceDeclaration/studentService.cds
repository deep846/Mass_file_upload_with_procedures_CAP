using {my.students as st} from '../../db';


service StudentsService {

entity students as projection on st.students;
action uploadStudentExcel (file:String);

}


annotate StudentsService.uploadStudentExcel
  with @cds.server.body_parser.limit: '10mb';
