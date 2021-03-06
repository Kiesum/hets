import React from 'react';

import { connect } from 'react-redux';

import { Grid, Row, Col } from 'react-bootstrap';
import { Form, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap';

import EditDialog from '../../components/EditDialog.jsx';
import FormInputControl from '../../components/FormInputControl.jsx';

import { isBlank } from '../../utils/string';

var EquipmentEditDialog = React.createClass({
  propTypes: {
    equipment: React.PropTypes.object,

    onSave: React.PropTypes.func.isRequired,
    onClose: React.PropTypes.func.isRequired,
    show: React.PropTypes.bool,
  },

  getInitialState() {
    return {
      isNew: this.props.equipment.id === 0,

      serialNumber: this.props.equipment.serialNumber || '',
      make: this.props.equipment.make || '',
      size: this.props.equipment.size || '',
      model: this.props.equipment.model || '',
      year: this.props.equipment.year || '',
      licencePlate: this.props.equipment.licencePlate || '',
      operator: this.props.equipment.operator || '',

      serialNumberError: null,
      licencePlateError: null,
    };
  },

  componentDidMount() {
    // this.input.focus();
  },

  updateState(state, callback) {
    this.setState(state, callback);
  },

  didChange() {
    if (this.state.serialNumber !== this.props.equipment.serialNumber) { return true; }
    if (this.state.make !== this.props.equipment.make) { return true; }
    if (this.state.size !== this.props.equipment.size) { return true; }
    if (this.state.model !== this.props.equipment.model) { return true; }
    if (this.state.year !== this.props.equipment.year) { return true; }
    if (this.state.licencePlate !== this.props.equipment.licencePlate) { return true; }
    if (this.state.operator !== this.props.equipment.operator) { return true; }

    return false;
  },

  isValid() {
    this.setState({
      serialNumberError: null,
      licencePlateError: null,
    });

    var valid = true;

    if (isBlank(this.state.serialNumber)) {
      this.setState({ serialNumberError: 'Serial number is required' });
      valid = false;
    }

    if (isBlank(this.state.licencePlate)) {
      this.setState({ licencePlateError: 'Licence plate is required' });
      valid = false;
    }

    return valid;
  },

  onSave() {
    this.props.onSave({ ...this.props.equipment, ...{
      serialNumber: this.state.serialNumber,
      make: this.state.make,
      size: this.state.size,
      model: this.state.model,
      year: this.state.year,
      licencePlate: this.state.licencePlate,
      operator: this.state.operator,
    }});
  },

  render() {
    return <EditDialog id="equipment-edit" show={ this.props.show }
      onClose={ this.props.onClose } onSave={ this.onSave } didChange={ this.didChange } isValid={ this.isValid }
      title= { 
        <strong>Equipment
          <span>Serial Number: <small>{ this.props.equipment.serialNumber }</small></span>
          <span>Plate: <small>{ this.props.equipment.licencePlate }</small></span>
        </strong>
      }>
      {(() => {
        return <Form>
          <Grid fluid>
            <Row>
              <Col md={6}>
                <FormGroup controlId="serialNumber" validationState={ this.state.serialNumberError ? 'error' : null }>
                  <ControlLabel>Serial Number <sup>*</sup></ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.serialNumber } updateState={ this.updateState } inputRef={ ref => { this.input = ref; }}/>
                  <HelpBlock>{ this.state.serialNumberError }</HelpBlock>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="licencePlate" validationState={ this.state.licencePlateError ? 'error' : null }>
                  <ControlLabel>Licence Number <sup>*</sup></ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.licencePlate } updateState={ this.updateState }/>
                  <HelpBlock>{ this.state.licencePlateError }</HelpBlock>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup controlId="make">
                  <ControlLabel>Make</ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.make } updateState={ this.updateState }/>                  
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="size">
                  <ControlLabel>Size</ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.size } updateState={ this.updateState }/>                  
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup controlId="model">
                  <ControlLabel>Model</ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.model } updateState={ this.updateState }/>                  
                </FormGroup>
              </Col>
              <Col md={6}>
                {/* TODO Equipment type drop-down */}
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <FormGroup controlId="year">
                  <ControlLabel>Year</ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.year } updateState={ this.updateState }/>                  
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup controlId="operator">
                  <ControlLabel>Operator</ControlLabel>
                  <FormInputControl type="text" defaultValue={ this.state.operator } updateState={ this.updateState }/>                  
                </FormGroup>
              </Col>
            </Row>
          </Grid>
        </Form>;
      })()}
    </EditDialog>;
  },
});

function mapStateToProps(state) {
  return {
    equipment: state.models.equipment,
  };
}

export default connect(mapStateToProps)(EquipmentEditDialog);
