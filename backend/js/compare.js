//combining all properties related to Output section
class Output {
    constructor() {
        this.o_pid = [];
        this.o_arrivaltime = [];
        this.o_bursttime = [];
        this.o_priority = [];
        this.completionTime = [];
        this.turnAroundTime = [];
        this.waitingTime = [];
        this.avgWait = 0;
        this.avgtat = 0;
        this.utilization = 0;
        this.quantum = 0;
        this.algorithm = '';
    }
}

//   var finalOutputobj = new finalOutput();
var mainOutput = new Output();

var processTotal;
var Selectedalgorithm;
var tq;
var minWaitingTime = Number.MAX_SAFE_INTEGER;
var minTurnaroundTime = Number.MAX_SAFE_INTEGER;
var minWaitingAlgorithm = "";
var minTurnaroundAlgorithm = "";

$(document).ready(function() {

    $('#explanation-equation').hide();

    $(".priority").collapse({ toggle: false });


    //default algorithm is First Come First Served
    var algorithm = "FCFS";

    //used to keep track of how long the CPU has been running as opposed to idle
    var runningTime = 0;

    //the time it takes to switch between processes
    var contexSwitch = 0;

    //array used to store the processes
    var processArray = [];

    //the time quantum used in Round Robin
    var timeQuantum = 2;

    //the amount of processes, this is used to load in values into processArray
    var processCount = 3;

    //used to keep track of the position
    var position = 0;

    //things are put into here to display

    //set up program initially
    run();

    setTimeout(function() { run() }, 200);

    //used for SJF and SRJF, finds the index of the next available smallest job
    function findSmallestBurstIndex() {
        var smallestIndex = 0;
        var smallestBurst = 0;

        //finds an initial burst time
        for (var i = 0; i < processArray.length; i++) {
            if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
                smallestIndex = i;
                smallestBurst = processArray[i].burstTime;
                break;
            }
        }

        //looks through the array to find a smaller burst time
        for (var i = smallestIndex; i < processArray.length; i++) {
            if (processArray[i].burstTime < smallestBurst && processArray[i].done == false && processArray[i].arrivalTime <= position) {
                smallestIndex = i;
                smallestBurst = processArray[i].burstTime;
            }

        }
        return smallestIndex;
    }

    function findSmallestPriorityIndex() {
        var smallestIndex = 0;
        var smallestPriority = 0;

        //finds an initial burst time
        for (var i = 0; i < processArray.length; i++) {
            if (processArray[i].done == false && processArray[i].arrivalTime <= position) {
                smallestIndex = i;
                smallestPriority = processArray[i].priority;
                break;
            }
        }

        //looks through the array to find a smaller burst time
        for (var i = smallestIndex; i < processArray.length; i++) {
            if (processArray[i].priority < smallestPriority && processArray[i].done == false && processArray[i].arrivalTime <= position) {
                smallestIndex = i;
                smallestPriority = processArray[i].priority;
            }

        }
        return smallestIndex;
    }
    //checks if all the processes have completed
    function isDone() {
        var done = true;
        for (var i = 0; i < processArray.length; i++) {
            if (processArray[i].done == false) {
                done = false;
                //console.log("not done   i:"+i);
            }
        }

        return done;
    }

    function progressBar() {
        this.indexes = [];
        this.names = [];
        this.sum = 0;

        this.addItem = function(name, progressLength) {
            var previousName = this.names[this.names.length - 1];

            //if the process being added is the same as the current one, combine them
            if (this.names.length > 0 && previousName == name) {
                this.indexes[this.indexes.length - 1] += progressLength;
                this.sum += progressLength;
                position += progressLength;
            } else {
                if (previousName != "idle" && previousName != "context switch" && name != "idle" && position != 0 && contexSwitch > 0 ||
                    name == "idle" && progressLength <= contexSwitch && position != 0) {
                    this.indexes[this.indexes.length] = contexSwitch;
                    this.names[this.names.length] = "context switch";
                    this.sum += contexSwitch;
                    position += contexSwitch;
                    position = parseFloat(position.toPrecision(12));
                }
                if ((name == "idle" && progressLength <= contexSwitch && position != 0) == false) {
                    this.indexes[this.indexes.length] = progressLength;
                    this.names[this.names.length] = name;
                    this.sum += progressLength;
                    position += progressLength;
                }
            }
            position = parseFloat(position.toPrecision(12));
            this.sum = parseFloat(this.sum.toPrecision(12));

        }
        this.displayBar = function() {


            var pos = 0;

            for (var i = 0; i < this.indexes.length; i++) {
                // console.log("name:"+this.names[i]+"  index:"+this.indexes[i]);
                var length = (this.indexes[i] / this.sum) * 100;
                addToBar(this.names[i], length, pos, this.indexes[i], i);
                pos += this.indexes[i];
                pos = parseFloat(pos.toPrecision(12));
            }

            createRuler(this.sum);

            // console.log("sum:"+this.sum+"   "+runningTime);

            var utilization = 100 - (((this.sum - runningTime) / this.sum) * 100);
            utilization = Math.round(utilization * 100) / 100;

            sortNames();

            var waitTimes = [];

            waitTimes[0] = processArray[0].finishTime - processArray[0].arrivalTime - processArray[0].initialBurst;
            waitTimes[0] = parseFloat(waitTimes[0].toPrecision(12));
            var fullExplanation = '';

            fullExplanation += '<p class="lead"> CPU utilization: $ ' + utilization + '\\%   $' +
                '<br><br>Average Wait Time: <span style="font-size:24px">$ \\frac{' + waitTimes[0];

            var waitSum = waitTimes[0];

            for (var i = 1; i < processArray.length; i++) {
                waitTimes[i] = processArray[i].finishTime - processArray[i].arrivalTime - processArray[i].initialBurst;
                waitTimes[i] = parseFloat(waitTimes[i].toPrecision(12));

                fullExplanation += '+' + waitTimes[i];
                waitSum += waitTimes[i];
            }

            var averageWait = waitSum / processArray.length;
            averageWait = Math.round(averageWait * 10000) / 10000;

            fullExplanation += '}{' + processArray.length + '} $</span> $ = ' + averageWait + ' $';

            //set the equation text
            $("#explanation-equation").html(fullExplanation);

            mainOutput.waitingTime = waitTimes;
            mainOutput.avgWait = averageWait;
            mainOutput.utilization = utilization;

            Preview.Update();
        }
    }

    function process(processName, burstTime, arrivalTime, pIndex, newPriority) {
        this.processName = processName;
        this.burstTime = burstTime;
        this.initialBurst = burstTime;
        this.arrivalTime = arrivalTime;
        this.done = false;
        this.hasStarted = false;
        this.finishTime;
        this.priority = newPriority;

        this.pIndex = pIndex;

        this.finished = function() {
            this.done = true;
            this.finishTime = position;

        }
    }

    //     //sorts the processArray in terms of arrival times
    function sortArriveTimes() {

        function compareArrivals(process1, process2) {

            if (process1.arrivalTime > process2.arrivalTime) {
                return 1;
            } else if (process1.arrivalTime < process2.arrivalTime) {
                return -1;
            } else {
                return 0;
            }

        }

        processArray.sort(compareArrivals);
    }

    //     //sorts the processArray in terms of process names. i.e. P1,P2,P3, etc
    function sortNames() {

        function compareNames(process1, process2) {

            if (process1.pIndex > process2.pIndex) {
                return 1;
            } else if (process1.pIndex < process2.pIndex) {
                return -1;
            } else {
                return 0;
            }

        }

        processArray.sort(compareNames);
    }

    //     //loads the values into processArray from the table
    function loadValues() {
        processArray = [];

        runningTime = 0;

        var index = 0;
        for (var i = 0; i < processCount; i++) {

            var burstTime = Number($("#burst_" + (i + 1)).val()) + 0.0;
            runningTime += burstTime;
            var arrivalTime = Number($("#arrive_" + (i + 1)).val()) + 0.0;
            var processName = "P" + (i + 1);
            var priority = Number($("#priority_" + (i + 1)).val()) + 0.0;

            if (burstTime < 0) {
                alert("Please enter a valid Input...");
                location.reload();
            } else if (arrivalTime < 0) {
                alert("Please enter a valid Input...");
                location.reload();
            } else if (burstTime > 0 && isNaN(arrivalTime) == false) {
                processArray[index] = new process(processName, burstTime, arrivalTime, i, priority);
                index++;
            }


        }
    }

    // Array of algorithms
    var algorithms = ["FCFS", "SJF", "SRJF", "Round Robin", "Priority"];

    // Function to run the selected algorithm
    function run() {
        loadValues();
        Selectedalgorithm = algorithm;

        if (processArray.length > 0) {
            sortArriveTimes();
            position = 0;
            bar = new progressBar();

            if (algorithm == "FCFS") {
                // FCFS algorithm code
                FCFS();
                processTotal = processArray;
            } else if (algorithm == "SJF") {
                // SJF algorithm code
                SJF();
                processTotal = processArray;
            } else if (algorithm == "SRJF") {
                // SRJF algorithm code
                SRJF();
                processTotal = processArray;
            } else if (algorithm == "Round Robin") {
                // Round Robin algorithm code
                roundRobin();
                processTotal = processArray;
                tq = timeQuantum;
            } else if (algorithm == "Priority") {
                // Priority algorithm code
                $(".priority").collapse("show");
                priority();
                processTotal = processArray;
            }

            bar.displayBar();
        }
    }

    // Function to handle the "Run" button click event
    $(".compareButton").click(function() {
        // Run button property change
        var runbtn = document.getElementById('runBtn');
        runbtn.disabled = true;
        runbtn.style.background = 'grey';
        runbtn.style.cursor = 'not-allowed';

        // Iterate over the algorithms array
        for (let i = 0; i < algorithms.length; i++) {
            let algorithm = algorithms[i];

            // Run the selected algorithm
            runAlgorithm(algorithm);
        }

        console.log("Turn " + minTurnaroundAlgorithm + " " + minTurnaroundTime);
        console.log("Wat " + minWaitingAlgorithm + " " + minWaitingTime);



        $("#minWaitingAlgorithm").text(minWaitingAlgorithm);

        // Display the algorithm with the least average turnaround time
        $("#minTurnaroundAlgorithm").text(minTurnaroundAlgorithm);
    });

    // Function to run a specific algorithm
    function runAlgorithm(algorithm) {
        // Update the algorithm explanation text based on the selected algorithm
        // if (algorithm == "FCFS") {
        //     $("#algorithm_explanation").text("First Come First Served will execute processes in the order in which they arrived");
        // } else if (algorithm == "SJF") {
        //     $("#algorithm_explanation").text("Shortest Job First will execute processes from smallest to biggest");
        // } else if (algorithm == "SRJF") {
        //     $("#algorithm_explanation").text("Shortest Remaining Job First will execute processes from smallest to biggest. If a new process arrives that is smaller than the currently running process, it will interrupt it.");
        // } else if (algorithm == "Round Robin") {
        //     $("#algorithm_explanation").text("Round Robin will execute each process for the duration of the time quantum. It will then move on to the next process.");
        // } else if (algorithm == "Priority") {
        //     $(".priority").collapse("show");
        //     $("#algorithm_explanation").text("Priority Scheduling will execute each process according to the assigned priority. In this case, a lower priority number is better.");
        // }

        // Run the algorithm code based on the selected algorithm
        if (algorithm == "FCFS") {
            // FCFS algorithm code
            FCFS();
            processTotal = processArray;
        } else if (algorithm == "SJF") {
            // SJF algorithm code
            SJF();
            processTotal = processArray;
        } else if (algorithm == "SRJF") {
            // SRJF algorithm code
            SRJF();
            processTotal = processArray;
        } else if (algorithm == "Round Robin") {
            // Round Robin algorithm code
            roundRobin();
            processTotal = processArray;
            tq = timeQuantum;
        } else if (algorithm == "Priority") {
            // Priority algorithm code
            priority();
            processTotal = processArray;
        }

        // Display the results and update the table
        displayResults();
        createTable();
    }
    let averageWaitingTimes = [],
        averageTurnAroundTimes = [];
    // Display the results
    function displayResults() {
        // Update the algorithm explanation
        $("#algorithm_explanation").text("Explanation of the selected algorithm");

        // Update the average turnaround time
        mainOutput.avgtat = calculateAverageTurnaroundTime();
        let avgWaitingTime = calculateAverageWaitingTime();
        averageTurnAroundTimes.push(mainOutput.avgtat);

        // Store the average waiting time in the array
        averageWaitingTimes.push(avgWaitingTime);
        // Display the average turnaround time
        $("#avgTurnaroundTime").text(mainOutput.avgtat);

        // Update any other result display elements as needed
    }
    // Calculate the average turnaround time
    function calculateAverageTurnaroundTime() {
        let totalTurnaroundTime = 0;
        for (let i = 0; i < processTotal.length; i++) {
            totalTurnaroundTime += (processTotal[i].burstTime + processTotal[i].waitingTime);
        }
        return (totalTurnaroundTime / processTotal.length).toFixed(2);
    }

    function calculateAverageWaitingTime() {
        let totalWaitingTime = 0;
        for (let i = 0; i < processTotal.length; i++) {
            totalWaitingTime += processTotal[i].waitingTime;
        }
        return (totalWaitingTime / processTotal.length).toFixed(2);
    }


    // Create a table using average waiting and turnaround time lists
    function createTable() {
        // Get the reference to the table body
        var tableBody = $("#outputTable tbody");

        // Clear the table body
        tableBody.empty();

        // Check if the table head has already been added
        if ($("#outputTable thead").length === 0) {
            // Create the table head
            var tableHead = $("<thead>").appendTo("#outputTable");

            // Create the table header row
            $("<tr>")
                .append($("<th>").text("Algorithms").addClass("text-center").css("background-color", "#539165"))
                .append($("<th>").text("Average Waiting Time").addClass("text-center").css("background-color", "#539165"))
                .append($("<th>").text("Average Turnaround Time").addClass("text-center").css("background-color", "#539165"))
                .appendTo(tableHead);
        }


        // Iterate over the averageWaitingTimes and averageTurnaroundTimes lists
        for (let i = 0; i < averageWaitingTimes.length; i++) {
            var avgWaitingTime = averageWaitingTimes[i];
            var avgTurnaroundTime = averageTurnAroundTimes[i];
            var algorithmName = getAlgorithmName(i); // Get the algorithm name based on index

            // Create a new row
            var row = $("<tr>");

            // Add the cells to the row
            $("<td>").text(algorithmName).addClass("fw-bold").appendTo(row); // Algorithm name
            $("<td>").text(avgWaitingTime).appendTo(row); // Average waiting time
            $("<td>").text(avgTurnaroundTime).appendTo(row); // Average turnaround time

            // Append the row to the table body
            tableBody.append(row);

            if (avgWaitingTime < minWaitingTime) {
                minWaitingTime = avgWaitingTime;
                minWaitingAlgorithm = algorithmName;
            }

            // Check if the current algorithm has the least average turnaround time
            if (avgTurnaroundTime < minTurnaroundTime) {
                minTurnaroundTime = avgTurnaroundTime;
                minTurnaroundAlgorithm = algorithmName;
            }
        }
    }
    // }

    // Get the algorithm name based on index
    function getAlgorithmName(index) {
        switch (index) {
            case 0:
                return "FCFS";
            case 1:
                return "SJF";
            case 2:
                return "SRJF";
            case 3:
                return "Round Robin";
            case 4:
                return "Priority";
            default:
                return "";
        }
    }

    // FCFS algorithm code
    function FCFS() {
        let currentTime = 0;

        for (let i = 0; i < processArray.length; i++) {
            const process = processArray[i];

            // Set the start time for the process
            process.startTime = currentTime;

            // Calculate the finish time for the process
            process.finishTime = currentTime + process.burstTime;

            // Calculate the waiting time for the process
            process.waitingTime = currentTime - process.arrivalTime;

            // Update the current time
            currentTime = process.finishTime;
        }
    }

    // SJF algorithm code

    function SJF() {
        // Sort the process array based on burst time in ascending order
        processArray.sort((a, b) => a.burstTime - b.burstTime);

        let currentTime = 0;

        for (let i = 0; i < processArray.length; i++) {
            const process = processArray[i];

            // Set the start time for the process
            process.startTime = currentTime;

            // Calculate the finish time for the process
            process.finishTime = currentTime + process.burstTime;

            // Calculate the waiting time for the process
            process.waitingTime = currentTime - process.arrivalTime;

            // Update the current time
            currentTime = process.finishTime;
        }
    }

    // SRJF algorithm code
    function SRJF() {
        let currentTime = 0;

        while (true) {
            // Find the process with the shortest remaining time at the current time
            let shortestJob = null;

            for (let i = 0; i < processArray.length; i++) {
                const process = processArray[i];

                if (process.arrivalTime <= currentTime && (!shortestJob || process.remainingTime < shortestJob.remainingTime)) {
                    shortestJob = process;
                }
            }

            // If no process is found, exit the loop
            if (!shortestJob) {
                break;
            }

            // Set the start time for the process
            shortestJob.startTime = currentTime;

            // Execute the process for the remaining time
            const executeTime = Math.min(shortestJob.remainingTime, timeQuantum);
            currentTime += executeTime;
            shortestJob.remainingTime -= executeTime;

            // If the process is completed, calculate the finish time and waiting time
            if (shortestJob.remainingTime === 0) {
                shortestJob.finishTime = currentTime;
                shortestJob.waitingTime = shortestJob.finishTime - shortestJob.burstTime - shortestJob.arrivalTime;
            }
        }
    }

    // Round Robin algorithm code
    function roundRobin() {
        let currentTime = 0;
        let remainingTimeArray = processArray.map(process => process.burstTime);

        while (true) {
            let allProcessesCompleted = true;

            for (let i = 0; i < processArray.length; i++) {
                const process = processArray[i];

                if (process.arrivalTime <= currentTime && remainingTimeArray[i] > 0) {
                    allProcessesCompleted = false;

                    // Set the start time for the process
                    if (process.startTime === -1) {
                        process.startTime = currentTime;
                    }

                    // Execute the process for the time quantum
                    const executeTime = Math.min(remainingTimeArray[i], timeQuantum);
                    currentTime += executeTime;
                    remainingTimeArray[i] -= executeTime;

                    // If the process is completed, calculate the finish time and waiting time
                    if (remainingTimeArray[i] === 0) {
                        process.finishTime = currentTime;
                        process.waitingTime = process.finishTime - process.burstTime - process.arrivalTime;
                    }
                }
            }

            if (allProcessesCompleted) {
                break;
            }
        }
    }

    // Priority algorithm code
    function priority() {
        // Sort the process array based on priority in ascending order
        processArray.sort((a, b) => a.priority - b.priority);

        let currentTime = 0;

        for (let i = 0; i < processArray.length; i++) {
            const process = processArray[i];

            // Set the start time for the process
            process.startTime = currentTime;

            // Calculate the finish time for the process
            process.finishTime = currentTime + process.burstTime;

            // Calculate the waiting time for the process
            process.waitingTime = currentTime - process.arrivalTime;

            // Update the current time
            currentTime = process.finishTime;
        }
    }

    //     //creates the tick marks under the gant chart
    function createRuler(itemAmount) {

        var multi = 1;
        var word = " " + itemAmount;

        if (itemAmount > 5000) {
            // console.log("length:"+word.length)
            var power = Math.pow(10, word.length - 2);
            itemAmount = itemAmount / power;
            multi = power;
        } else if (itemAmount > 2500) {
            itemAmount = itemAmount / 100;
            multi = 100;
        } else if (itemAmount > 1000) {
            itemAmount = itemAmount / 50;
            multi = 50;
        } else if (itemAmount > 500) {
            itemAmount = itemAmount / 25;
            multi = 25;
        } else if (itemAmount > 100) {
            itemAmount = itemAmount / 10;
            multi = 10;
        } else if (itemAmount > 50) {
            itemAmount = itemAmount / 5;
            multi = 5;
        }


        for (var j = 0; j < itemAmount; j++) {
            var ruler = $("#rule2").empty();
            var len = Number(itemAmount) || 0;


            // add text

            var item = $(document.createElement("li"));
            $(item).addClass("zero");
            ruler.append(item.text(0));

            for (var i = 0; i < len; i++) {
                var item = $(document.createElement("li"));
                ruler.append(item.text(((i + 1) * multi)));
            }
        }
        var width = $(".progress").width();

        var spacing = (width / itemAmount) + "px";
        $(".ruler").css("padding-right", spacing).find("li").css("padding-left", spacing);
        $(".zero").css("padding-left", 0);
        $(".zero").css("padding-right", "0.5px");

    }
    //     /*
    //     ****************************************************************
    //     					All the click event listeners
    //     ****************************************************************
    //     */

    $('#add_row').click(function() {
        processCount++;
        $("#row_" + processCount).collapse("show");

        $('#remove_row').prop("disabled", false);
        if (processCount == 10) {
            $('#add_row').prop("disabled", true);
        }

        run();
        $('#proccess_num').val(processCount);
    });

    //removing a row
    $('#remove_row').click(function() {

        $("#row_" + processCount).collapse("hide");
        processCount--;

        $('#add_row').prop("disabled", false);
        if (processCount == 1) {
            $('#remove_row').prop("disabled", true);
        }
        run();
        $('#proccess_num').val(processCount);
    });


    $('#subtract_context').click(function() {

        if (contexSwitch >= 0.1) {
            contexSwitch -= 0.1;
            contexSwitch = parseFloat(contexSwitch.toPrecision(12));
        }


        run();
        $('#enter_context').val(contexSwitch);
    });


    $('#add_context').click(function() {
        contexSwitch += 0.1;
        contexSwitch = parseFloat(contexSwitch.toPrecision(12));
        run();
        $('#enter_context').val(contexSwitch);

    });

    $('#subtract_quantum').click(function() {

        if (timeQuantum > 0.5) {
            timeQuantum -= 0.5;
            timeQuantum = parseFloat(timeQuantum.toPrecision(12));
        }

        run();
        $('#enter_quantum').val(timeQuantum);
    });


    $('#add_quantum').click(function() {

        timeQuantum += 0.5;
        timeQuantum = parseFloat(timeQuantum.toPrecision(12));

        run();
        $('#enter_quantum').val(timeQuantum);

    });


    // when you enter a quantum time, used for Round Robin
    $('#enter_quantum').on('input propertychange paste', function() {

        if (isNaN($(this).val()) == false && $(this).val() != 0) {
            timeQuantum = Number($(this).val());
        }

        run();
    });

    //when you set a context switch time
    $('#enter_context').on('input propertychange paste', function() {

        if (isNaN($(this).val()) == false) {
            contexSwitch = Number($(this).val());
        }
        run();
    });

    //when you input a value into the table
    $('td input').on('input propertychange paste', function() {
        run();

    });

    //when you click on the algorithm dropdown
    $(".algorithm_dropdown li a").click(function() {
        $("#algorithm_button").html($(this).attr("calcStyle") + ' <span class="caret">');
        algorithm = $(this).attr("calcStyle");

        if (algorithm == "Round Robin") {
            $("#solver_group").removeClass("hidden");
        } else {
            $("#solver_group").addClass("hidden");
        }

        if (algorithm != "Priority") {
            $(".priority").collapse("hide");
        }

        run();

    })

    $(window).resize(function() {
        createRuler(bar.sum);
    });
});