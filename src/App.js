import React, { Component } from "react";
import "./App.css";
import { finished } from "stream";
require("string_score"); // It will automatically add a .score() method to all JavaScript String object... "String".score("str");
//import Symptoms from "./symptom.js";

const perPage = 20;
const scoreCheck = 0.8;

class App extends Component {
  state = {
    response: "",
    responseToPost: "",
    allSymptoms: [],
    drugRecommended: [],
    checked: [],
    drugObj: {},
    page: 0,
    maxPages: "",
    search: "",
    suggestedSearch: []
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
      }).sort(),
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
        let drugValidFlag = 0; // Set to true if the checked meets one of the drug conditions.
        for (let i = 0; i < drugArr.length; i++) {
          if (drugArr[i].every(val => checked.indexOf(val) !== -1)) {
            drugValidFlag = 1;
          }
        }
        if (drugValidFlag === 0) {
          this.setState(state => {
            const newDrugsRecommended = state.drugRecommended;
            newDrugsRecommended.splice(newDrugsRecommended.indexOf(drug), 1);
            state.drugRecommended = [...newDrugsRecommended];
          });
        }
      }
    }
    this.setState({ state: this.state });
  }

  addToSelected = listItem => {
    if (this.state.checked.indexOf(listItem) === -1) {
      this.setState(state => {
        const checked = [...state.checked, listItem];
        state.checked = checked;
      });
    } else {
      this.setState(state => {
        const checked = this.state.checked;
        checked.splice(this.state.checked.indexOf(listItem), 1);
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

  checkSearch(e) {
    this.setState({ search: e.target.value }, this.checkIfMatch);
    this.setState({ state: this.state });
  }

  checkIfMatch() {
    this.state.allSymptoms.forEach(symptom => {
      if (
        symptom.score(this.state.search) > scoreCheck &&
        this.state.checked.indexOf(symptom) === -1
      ) {
        this.setState(state => {
          const checked = [...state.checked, symptom];
          state.checked = checked;
        });
      }
    });
    this.setState({ state: this.state });
  }

  unCheck(symptom) {
    this.setState(state => {
      const checked = state.checked;
      checked.splice(checked.indexOf(symptom), 1);
      state.checked = checked;
    }, this.checkIfDrug);
  }

  suggestSearch(e) {
    this.setState({ search: e.target.value }, () => {
      let makingSuggestedSearch = [];
      this.state.allSymptoms.forEach(symptom => {
        if (symptom.score(this.state.search) > 0.5) {
          makingSuggestedSearch.push(symptom);
        }
      });
      this.setState({ suggestedSearch: makingSuggestedSearch });
      this.setState({ state: this.state });
    });
  }

  render() {
    let symptomList;
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
                onClick={e => this.addToSelected(e.target.innerHTML)}
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
        {symptom}{" "}
        <button className="Remove-checked" onClick={e => this.unCheck(symptom)}>
          {" "}
          -
        </button>
      </li>
    ));

    let drugList = this.state.drugRecommended.map((drug, i, a) => (
      <li className="Drug-list" key={this.state.drugRecommended[i]}>
        {drug}
      </li>
    ));

    let suggestSearch = this.state.suggestedSearch.map((symptom, i, a) => (
      <li className="Suggested-list-item" key={i}>
        <button className="Suggested-list-item-button" onClick={(e)=> this.addToSelected(symptom)}> {symptom}</button>
      </li>
    ));

    return (
      <div className="App">
        <header className="App-header">
          <h1> Over The Counter Drug Recommendations </h1>
        </header>

        <div>
          <div className="Symptoms-component">
            <div className="Search-bar">
              <form onSubmit={e => e.preventDefault()}>
                <h1> Search or click on symptoms list</h1>
                <input
                  className="Symptom-input"
                  type="text"
                  value={this.state.search}
                  onChange={e => this.suggestSearch(e)}
                />
              </form>
              <ul className="Suggested-list">{suggestSearch}</ul>
            </div>
            <h1> Do you have any of these symptoms?</h1>
            <div className="Symptoms-list">
            <ul>{symptomList}</ul>
            </div>
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
