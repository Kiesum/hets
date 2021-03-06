import React from 'react';

import { Table } from 'react-bootstrap';

import _ from 'lodash';

var TableControl = React.createClass({
  propTypes: {
    // Array of objects with key, title, style, children fields
    headers: React.PropTypes.array.isRequired,
    id: React.PropTypes.string,
    children: React.PropTypes.node,
  },

  render() {
    return <div id={ this.props.id }>
      <Table condensed striped>
        <thead>
          <tr>
            {
              _.map(this.props.headers, (header) => {
                return <th key={ header.field } style={ header.style }>{ header.node ? header.node : header.title }</th>;
              })
            }
          </tr>
        </thead>
        <tbody>
          { this.props.children }
        </tbody>
      </Table>
    </div>;
  },
});

export default TableControl;
