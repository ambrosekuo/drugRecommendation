import React, { Component } from "react";
import "./App.css";
//import Symptoms from "./symptom.js";

const perPage = 5;

class App extends Component {
  state = {
    response: "",
    post: "",
    responseToPost: "",
    allSymptoms: [],
    drugRecommended: [],
    checked: [],
    drugObj: {},
    page: 0,
    maxPages: ""
  };

  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ response: res.express }))
      .catch(err => console.log(err));
  }

  callApi = async () => {
    const response = await fetch("/api/getData");
    const body = await response.json();
    this.setState(state => {
      const parsedArr = this.parseData(body);
      state.allSymptoms = parsedArr[0];
      state.drugObjList = parsedArr[1];
      state.maxPages = Math.ceil(parsedArr[0].length / perPage);
    });

    if (response.status !== 200) throw Error(response.message);
    return response;
  };

  parseData = data => {
    let allSymptoms = [];
    let drugObjList = {};
    data.forEach((row, i) => {
      if (i > 0 && row[1] != null) {
        const drug = row[2];
        drugObjList[drug] = [];

        // Skips first row
        // Symptoms in 2nd column of array

        let rowSymptoms = row[1].split(",");
        rowSymptoms.forEach((unformatSymptom, i, a) => {
          // Using regex / / to replace \s (spaces) at beginning and at end of string

          a[i] = unformatSymptom.replace(/^\s+/, "").replace(/\s+$/, "");
        }); // Array of symptoms formatted
        //console.log(rowSymptoms);
        let allSplitSymptoms = [];
        rowSymptoms.forEach(symptoms => {
          const splitSymptoms = symptoms.split("/");
          drugObjList[drug].push([...splitSymptoms]);
          allSplitSymptoms.push(...splitSymptoms);
        });
        allSymptoms = [...allSymptoms, ...allSplitSymptoms];
      }
    });
    // Removing duplicates
    return [
      allSymptoms.filter((el, i, a) => {
        return a.indexOf(el) === i;
      }),
      drugObjList
    ];
  };

  handleSubmit = async e => {
    e.preventDefault();
    const response = await fetch("/api/world", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ post: this.state.post })
    });
    const body = await response.text();
    this.setState({ responseToPost: body });
  };

  checkIfDrug() {
    let checked = this.state.checked;
    let drugRecommended = this.state.drugRecommended;
    for (let [drug, drugArr] of Object.entries(this.state.drugObjList)) {
      // Drug does not exist in array
      if (drugRecommended.indexOf(drug) === -1) {
        // Every symptom in drug exists in checked
        drugArr.forEach(arr => {
          if (arr.every(val => checked.indexOf(val) !== -1)) {
            this.setState(state => {
              state.drugRecommended = [...state.drugRecommended, drug];
            });
          }
        });
      }
      // Drug added in, but checked requirements no longer met
      // A symptom in drug does not exists in checked
      else {
        drugArr.every(arr => {
          if (!arr.every(val => checked.indexOf(val) !== -1)) {
            this.setState(state => {
              const newDrugsRecommended = state.drugRecommended;
              newDrugsRecommended.splice(newDrugsRecommended.indexOf(drug), 1);
              state.drugRecommended = [...newDrugsRecommended];
            });
            return false;
          }
          return true;
        });
      }
    }
    this.setState({ state: this.state });
  }

  addToSelected = listItem => {
    if (this.state.checked.indexOf(listItem.innerHTML) === -1) {
      this.setState(state => {
        const checked = [...state.checked, listItem.innerHTML];
        state.checked = checked;
      });
    } else {
      this.setState(state => {
        const checked = this.state.checked;
        checked.splice(this.state.checked.indexOf(listItem.innerHTML), 1);
        state.checked = checked;
      });
    }
    this.setState({ state: this.state }, this.checkIfDrug);
  };

  movePage(action) {
    if (action === "back" && this.state.page > 0) {
      this.setState({ page: this.state.page - 1 });
    } else if (
      action === "forward" &&
      (this.state.page + 1) * perPage < this.state.allSymptoms.length
    ) {
      this.setState({ page: this.state.page + 1 });
    }
    this.setState({ state: this.state });
  }

  render() {
    let symptomList;
    const page = this.state.page;
    if (this.state.allSymptoms) {
      symptomList = this.state.allSymptoms.map((symptom, i, a) => {
        if (
          this.state.page * perPage <= i &&
          i < (this.state.page + 1) * perPage
        ) {
          let symptomClassName = "Symptom-button";
          if (this.state.checked.indexOf(symptom) !== -1) {
            symptomClassName = symptomClassName + " Symptom-clicked";
          }
          let symptomListItem = (
            <li className="symptoms" key={this.state.allSymptoms[i]}>
              <button
                className={symptomClassName}
                onClick={e => this.addToSelected(e.target)}
              >
                {symptom}
              </button>
            </li>
          );
          return symptomListItem;
        }
      });
    }

    let checkedList = this.state.checked.map((symptom, i, a) => (
      <li className="Checked-symptoms" key={this.state.checked[i]}>
        {symptom}
      </li>
    ));

    let drugList = this.state.drugRecommended.map((drug, i, a) => (
      <li className="Drug-list" key={this.state.drugRecommended[i]}>
        {drug}
      </li>
    ));

    return (
      <div className="App">
        <header className="App-header">
          <h1> Miranda's Recommendations </h1>
        </header>

        <div>
          <div className="Symptom-list">
            <h1> Do you have any of these symptoms?</h1>
            <ul>{symptomList}</ul>
            <div>
              <button
                className="Page-nav-button"
                onClick={() => this.movePage("back")}
              >
                {" "}
                &lt;={" "}
              </button>
              <button
                className="Page-nav-button"
                onClick={() => this.movePage("forward")}
              >
                {" "}
                =>{" "}
              </button>
              <h3>
                {" "}
                Page {this.state.page + 1} of {this.state.maxPages}{" "}
              </h3>
            </div>
          </div>
          <div className="Checked-component">
            <h1> Symptoms checked </h1>
            <ul className="Checked-list">{checkedList}</ul>
          </div>
          <div className="Drug-recommendations">
            <h1> Drug recommendations </h1>
            <ul className="Drug-list"> {drugList}</ul>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
