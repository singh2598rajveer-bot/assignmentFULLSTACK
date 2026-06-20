class Student {
    constructor(name, scores) {
        this.name = name;
        this.scores = scores;
    }

    get average() {
        let sum = 0;
        for (let i = 0; i < this.scores.length; i++) {
            sum += this.scores[i];
        }
        return sum / this.scores.length;
    }

    get letterGrade() {
        const avg = this.average;
        if (avg >= 90) return 'A';
        if (avg >= 80) return 'B';
        if (avg >= 70) return 'C';
        if (avg >= 60) return 'D';
        return 'F';
    }

    summary() {
        let max = this.scores[0];
        let min = this.scores[0];
        for (let i = 1; i < this.scores.length; i++) {
            if (this.scores[i] > max) max = this.scores[i];
            if (this.scores[i] < min) min = this.scores[i];
        }
        return { max, min };
    }
}

const args = process.argv;
const name = args[2];
const scoresStr = args.slice(3);

if (!name || scoresStr.length < 3) {
    console.error("Error: Please provide a name and at least 3 scores.");
    process.exit(1);
}

const scores = [];
for (let i = 0; i < scoresStr.length; i++) {
    scores.push(Number(scoresStr[i]));
}

const student = new Student(name, scores);
const avg = student.average;
const grade = student.letterGrade;
const { max, min } = student.summary();

const [score1, score2, ...remaining] = scores;

const status = avg >= 60 ? 'PASS' : 'FAIL';
let remark = "";
switch (grade) {
    case 'A': remark = "Excellent work!"; break;
    case 'B': remark = "Good job!"; break;
    case 'C': remark = "Needs improvement."; break;
    case 'D': remark = "Barely passed."; break;
    case 'F': remark = "Failed. Please see the instructor."; break;
}

const reportCard = `
================================
STUDENT REPORT CARD
================================
Name: ${student.name}
Scores breakdown: ${score1}, ${score2}, and others: ${remaining.join(', ')}
--------------------------------
Average: ${avg.toFixed(1)}
Letter Grade: ${grade}
High Score: ${max}
Low Score: ${min}
Status: ${status}
Remark: ${remark}
================================
`;

console.log(reportCard);