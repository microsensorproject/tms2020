import { Component, OnInit } from '@angular/core';
import {ExamManagerService} from '../exam-manager.service';
import {Exam} from '../../model/exam';
import {ActivatedRoute, Router} from "@angular/router";
import {Observable, timer} from 'rxjs';
import {map, take, tap} from 'rxjs/operators';
import { Question } from 'src/app/model/question';
import { QuestionSubmission } from 'src/app/model/question-submission';

@Component({
  selector: 'app-exam',
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.scss']
})
export class ExamComponent implements OnInit {

  // exam: Exam;
  // currentQuestion: number = 0;
  // currentQuestionText: string;
  // choices: any;
  // defaultChoice: any;

  public questions: Question[] = [];
  public markedQuestions: number[] = [];
  public qIndex: number;
  private examId: number;
  public exam: Exam;
  public diff: any;

  counter$: Observable<number>;
  count = 1800000;
  minute = 60000;


  constructor(private examManager: ExamManagerService, private route: ActivatedRoute, private router: Router) {
    this.route.params.subscribe( params => {
      this.examManager.takeExam(params['id']).subscribe((data) => {
        this.questions = <Question[]>data;
        this.questions = this.questions.sort((q1, q2) => q1.id - q2.id);
        this.qIndex = 0;
        this.examId = params['id'];

        this.examManager.getExam(params['id']).subscribe( (data) => {
          this.exam = data;
          // let today: any = new Date();
          // // console.log(today);
          // let deadline: any = new Date(this.exam.examDate);
          // deadline = new Date(deadline.getTime() + 5*60*60*1000)
          // // console.log(Christmas);
          // let diffMs: any = (deadline - today); // milliseconds between now & Christmas
          // // let diffDays = Math.floor(diffMs / 86400000); // days
          // // let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
          // let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
          //
          // // console.log(diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes until Christmas 2009 =)");
          // this.diff = diffMins;
          // console.log("first");
          // console.log(today);
          // console.log(deadline);
          // console.log(diffMs);
          // console.log(diffMins);

          this.counter$ = timer(0,60000).pipe(
            take(this.count),
            map(() => this.count = this.count - this.minute),
            tap( val => {
              let today: any = new Date();
              let deadline: any = new Date(this.exam.examDate);
              //let deadline: any = this.exam.examDate;
              deadline = new Date(deadline.getTime() + 5*60*60*1000);
              let diffMs: any = (deadline - today); // milliseconds between deadline and now
              // let diffDays = Math.floor(diffMs / 86400000); // days
              // let diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
              let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
              this.diff = diffMins;
            })
          );
        });
      });
    });
  }

  choose(value: string) {

    this.questions[this.qIndex].choices[value].chosen = !this.questions[this.qIndex].choices[value].chosen;
  }

  ngOnInit() {
  }

  public next(): void {
    if (this.qIndex < this.questions.length -1){
      this.submitQuestion().subscribe(data => this.qIndex = this.qIndex + 1);
    }
  }

  public prev(): void {
    if (this.qIndex > 0) {
      this.submitQuestion().subscribe(data => this.qIndex -= 1);
    }
  }

  public jumpTo(index: number) {
    this.submitQuestion().subscribe(data => {
      if (index >= 0 && index < this.questions.length) {
        this.qIndex = index;
      }
    });
  }

  public toggleFlag() {
    this.questions[this.qIndex].flagged = !this.questions[this.qIndex].flagged;
  }

  public isFlagged() : boolean {
    return this.questions[this.qIndex].flagged;
  }

  public hasFlags() : boolean {
    return this.questions.filter(q => q.flagged).length > 0;
  }

  public submitExam(): void {
    this.examManager.submitExam(this.examId).subscribe( data => {
      this.router.navigate(['/'])
    })
  }

  public submitQuestion() : Observable<Object> {
    let questionSubmission = new QuestionSubmission();
    questionSubmission.examId = this.examId;
    questionSubmission.questionId = this.questions[this.qIndex].id;
    questionSubmission.choiceEmsDtos = this.questions[this.qIndex].choices;
    questionSubmission.flagged = this.questions[this.qIndex].flagged;
    console.log(questionSubmission);
    return this.examManager.submitQuestion(questionSubmission);
  }

  /**
   * Submitting the exam & redirecting to corresponding results
   */
  public submit(){
    this.submitQuestion().subscribe( data => {
      console.log(data);
      if(confirm("Are you sure to submit the exam?")) {
        this.submitExam();
      }
    });
  }
}