import React, { Component } from 'react';

const Symptoms = props => (
    <li>
        <a classname="links"> {props.children} </a>
    </li>
  );

export default Symptoms;