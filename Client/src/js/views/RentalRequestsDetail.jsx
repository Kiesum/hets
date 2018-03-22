import React from 'react';

import { connect } from 'react-redux';

import { browserHistory } from 'react-router';

import { Grid, Well, Row, Col, Alert, Button, ButtonGroup, Glyphicon, Label } from 'react-bootstrap';
import { Link } from 'react-router';

import _ from 'lodash';
import Promise from 'bluebird';

import Moment from 'moment';

import HireOfferEditDialog from './dialogs/HireOfferEditDialog.jsx';
import RentalRequestsEditDialog from './dialogs/RentalRequestsEditDialog.jsx';
import DocumentsListDialog from './dialogs/DocumentsListDialog.jsx';
import NotesDialog from './dialogs/NotesDialog.jsx';

import * as Action from '../actionTypes';
import * as Api from '../api';
import * as Constant from '../constants';
import * as Log from '../history';
import store from '../store';

import CheckboxControl from '../components/CheckboxControl.jsx';
import ColDisplay from '../components/ColDisplay.jsx';
import Spinner from '../components/Spinner.jsx';
import TableControl from '../components/TableControl.jsx';
import Confirm from '../components/Confirm.jsx';
import History from '../components/History.jsx';
import OverlayTrigger from '../components/OverlayTrigger.jsx';

import { formatDateTime } from '../utils/date';
import { concat } from '../utils/string';

/*

TODO:
* Print / Notes / Docs / Contacts (TBD) / History / Request Status List / Clone / Request Attachments

*/
const STATUS_YES = 'Yes';
const STATUS_NO = 'No';
const STATUS_FORCE_HIRE = 'Force Hire';
const STATUS_ASKED = 'Asked';
const STATUS_IN_PROGRESS = 'In Progress';

var RentalRequestsDetail = React.createClass({
  propTypes: {
    rentalRequest: React.PropTypes.object,
    rentalRequestRotationList: React.PropTypes.object,
    rentalAgreement: React.PropTypes.object,
    notes: React.PropTypes.object,
    attachments: React.PropTypes.object,
    documents: React.PropTypes.object,
    history: React.PropTypes.object,
    params: React.PropTypes.object,
    ui: React.PropTypes.object,
    router: React.PropTypes.object,
  },

  getInitialState() {
    return {
      loading: false,
      loadingHistory: false,

      showEditDialog: false,
      showHireOfferDialog: false,
      showNotesDialog: false, 

      showAttachmentss: false,

      rotationListHireOffer: {},

      isNew: this.props.params.rentalRequestId == 0,
    };
  },

  componentDidMount() {
    this.fetch();
  },

  fetch() {
    this.setState({ loading: true });
    var rentalRequestId = this.props.params.rentalRequestId;
    var rentalRequestsPromise = Api.getRentalRequest(rentalRequestId);
    var rotationListPromise = Api.getRentalRequestRotationList(rentalRequestId);
    var documentsPromise = Api.getRentalRequestDocuments(rentalRequestId);
    var rentalRequestNotesPromise = Api.getRentalRequestNotes(rentalRequestId);


    return Promise.all([rentalRequestsPromise, rotationListPromise, documentsPromise, rentalRequestNotesPromise]).finally(() => {
      this.setState({ loading: false });
    });
  },

  updateState(state, callback) {
    this.setState(state, callback);
  },

  updateContactsUIState(state, callback) {
    this.setState({ ui: { ...this.state.ui, ...state }}, () => {
      store.dispatch({ type: Action.UPDATE_PROJECT_CONTACTS_UI, projectContacts: this.state.ui });
      if (callback) { callback(); }
    });
  },

  showNotes() {
    this.setState({ showNotesDialog: true });
  },

  closeNotesDialog() {
    this.setState({ showNotesDialog: false });
  },

  showDocuments() {
    this.setState({ showDocumentsDialog: true });
  },

  closeDocumentsDialog() {
    this.setState({ showDocumentsDialog: false });
  },

  addDocument() {

  },

  openEditDialog() {
    this.setState({ showEditDialog: true });
  },

  closeEditDialog() {
    this.setState({ showEditDialog: false });
  },

  saveEdit(rentalRequest) {
    Api.updateRentalRequest(rentalRequest).finally(() => {
      Log.rentalRequestModified(this.props.rentalRequest.data);
      this.closeEditDialog();
      Api.getRentalRequestRotationList(this.props.params.rentalRequestId);
    });
  },

  openHireOfferDialog(hireOffer) {
    this.setState({
      rotationListHireOffer: hireOffer,
      showHireOfferDialog: true,
    });
  },

  closeHireOfferDialog() {
    this.setState({ showHireOfferDialog: false });
  },

  saveHireOffer(hireOffer) {
    let hireOfferUpdated = { ...hireOffer };
    delete hireOfferUpdated.showAllResponseFields;
    delete hireOfferUpdated.displayFields;
    Api.updateRentalRequestRotationList(hireOfferUpdated, this.props.rentalRequest.data).then((response) => {

      if (response.error) { return; }

      this.fetch();
      if ((hireOffer.offerResponse === STATUS_YES || hireOffer.offerResponse === STATUS_FORCE_HIRE)) {
        this.props.router.push({ pathname: `${Constant.RENTAL_AGREEMENTS_PATHNAME}/${response.rentalAgreement.id}` });
      }
      this.closeHireOfferDialog();
      Log.rentalRequestEquipmentHired(this.props.rentalRequest.data, hireOffer.equipment, hireOffer.offerResponse);
    });
  },

  saveNewRentalAgreement(rentalRequestRotationList) {
    var rentalRequest = this.props.rentalRequest.data;

    var newAgreement = {
      equipment: { id: rentalRequestRotationList.equipment.id },
      project: { id: rentalRequest.project.id },
      estimateHours: rentalRequest.expectedHours,
      estimateStartWork: rentalRequest.expectedStartDate,
    };

    Api.addRentalAgreement(newAgreement).then(() => {
      // Update rotation list entry to reference the newly created agreement
      return Api.updateRentalRequestRotationList({...rentalRequestRotationList, rentalAgreement: { id: this.props.rentalAgreement.id }}, rentalRequest);
    }).finally(() => {
      // Open it up
      this.props.router.push({ pathname: `${Constant.RENTAL_AGREEMENTS_PATHNAME}/${this.props.rentalAgreement.id}` });
    });
  },

  print() {
    window.print();
  },

  addRequest() {

  },

  renderStatusText(listItem) {
    let text = 'Hire';
    if (listItem.offerResponse === STATUS_NO) {
      text = listItem.offerRefusalReason;
    } else if (listItem.offerResponse === STATUS_ASKED) {
      text = `${listItem.offerResponse} (${Moment(listItem.askedDateTime).format('YYYY-MM-DD hh:mm A')})`;
    } else if (listItem.offerResponse === STATUS_FORCE_HIRE || listItem.offerResponse === STATUS_YES) {
      text = listItem.offerResponse;
    }
    return text;
  },

  render() {
    var rentalRequest = this.props.rentalRequest.data;
    
    return <div id="rental-requests-detail">
      <Row id="rental-requests-top">
        <Col sm={10}>
          <Label bsStyle={ rentalRequest.isActive ? 'success' : rentalRequest.isCancelled ? 'danger' : 'default' }>{ rentalRequest.status }</Label>
          <Button title="Notes" onClick={ this.showNotes }>Notes ({ Object.keys(this.props.notes).length })</Button>
          <Button title="Documents" onClick={ this.showDocuments }>Documents ({ Object.keys(this.props.documents).length })</Button>
        </Col>
        <Col sm={2}>
          <div className="pull-right">
            <Button title="Return" onClick={ browserHistory.goBack }><Glyphicon glyph="arrow-left" /> Return</Button>
          </div>
        </Col>
      </Row>

      <Well className="request-information">
        <h3>Request Information <span className="pull-right">
          { rentalRequest.status !== Constant.RENTAL_REQUEST_STATUS_CODE_COMPLETED &&
            <Button title="Edit Rental Request" bsSize="small" onClick={ this.openEditDialog }><Glyphicon glyph="pencil" /></Button>
          }
        </span></h3>
        {(() => {
          if (this.state.loading) { return <div className="spinner-container"><Spinner/></div>; }

          var requestAttachments = rentalRequest.rentalRequestAttachments && rentalRequest.rentalRequestAttachments[0] ? rentalRequest.rentalRequestAttachments[0].attachment : 'None';

          return <Grid fluid id="rental-requests-data" className="nopadding">
            <Row>
              <Col md={6} sm={6} xs={12}>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Project"><strong>{ rentalRequest.project && rentalRequest.project.name }</strong></ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Provincial Project Number"><strong>{ rentalRequest.project && rentalRequest.project.provincialProjectNumber }</strong></ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label={ rentalRequest.projectPrimaryContactRole || 'Primary Contact' }>
                  { concat(rentalRequest.projectPrimaryContactName, rentalRequest.projectPrimaryContactPhone, ', ') }
                </ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Local Area">{ rentalRequest.localAreaName }</ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Equipment Type">{ rentalRequest.equipmentTypeName }</ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Count">{ rentalRequest.equipmentCount }</ColDisplay>
              </Col>
              <Col md={6} sm={6} xs={12}>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Attachment(s)">{ requestAttachments }</ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Expected Hours">{ rentalRequest.expectedHours }</ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Expected Start Date">{  formatDateTime(rentalRequest.expectedStartDate, Constant.DATE_YEAR_SHORT_MONTH_DAY) }</ColDisplay>
                <ColDisplay md={12} xs={12} labelProps={{ md: 4 }} label="Expected End Date">{ formatDateTime(rentalRequest.expectedEndDate, Constant.DATE_YEAR_SHORT_MONTH_DAY) }</ColDisplay>
              </Col>
            </Row>
          </Grid>;
        })()}
      </Well>

      <Well>
        <h3>Request Status <span className="pull-right">
          <Button onClick={ this.print }><Glyphicon glyph="print" title="Print" /></Button>
          <CheckboxControl id="showAttachments" inline updateState={ this.updateState }><small>Show Attachments</small></CheckboxControl>
        </span></h3>
        {(() => {
          if (this.state.loading) { return <div className="spinner-container"><Spinner/></div>; }
          
          var rotationList = this.props.rentalRequestRotationList.data.rentalRequestRotationList;

          if (Object.keys(rotationList || []).length === 0) { return <Alert bsStyle="success">No equipment</Alert>; }
          
          // Sort in rotation list order
          rotationList = _.sortBy(rotationList, 'rotationListSortOrder');
          
          var headers = [
            { field: 'seniority',               title: 'Seniority'         },
            { field: 'serviceHoursThisYear',    title: 'YTD Hours'         },
            { field: 'equipmentCode',           title: 'Equipment ID'      },
            { field: 'equipmentDetails',        title: 'Equipment Details' },
            { field: 'equipmentOwner',           title: 'Owner'             },
            { field: 'primaryContactName',      title: 'Contact'           },
            { field: 'primaryContactWorkPhone', title: 'Work Phone'        },
            { field: 'primaryContactCellPhone', title: 'Cell Phone'        },
            { field: 'status',                  title: 'Status'            },
          ];

          var numberEquipmentAvailableForNormalHire = rentalRequest.equipmentCount - rentalRequest.yesCount;

          return <TableControl id="rotation-list" headers={ headers }>
            {
              _.map(rotationList, (listItem) => {
                const owner = listItem.equipment.owner;
                var showAllResponseFields = false;
                if ((numberEquipmentAvailableForNormalHire > 0) && (listItem.offerResponse === STATUS_ASKED || !listItem.offerResponse) && (rentalRequest.yesCount < rentalRequest.equipmentCount)) { 
                  showAllResponseFields = true;  
                  numberEquipmentAvailableForNormalHire -= 1;
                }
                return (
                  <tr key={ listItem.id }>
                    <td>{ listItem.displayFields.seniority }</td>
                    <td>{ listItem.equipment.hoursYtd }</td>
                    <td><Link to={ `${Constant.EQUIPMENT_PATHNAME}/${listItem.equipment.id}` }>{ listItem.equipment.equipmentCode }</Link></td>
                    <td>{ listItem.displayFields.equipmentDetails }
                      { this.state.showAttachments && 
                      <div>
                        Attachments:
                        { listItem.equipment.equipmentAttachments && listItem.equipment.equipmentAttachments.map((item, i) => (
                          <span key={item.id}> { item.typeName }
                          { ((i + 1) < listItem.equipment.equipmentAttachments.length) &&
                            <span>,</span>
                          }
                          </span>
                        ))}
                        { (!listItem.equipment.equipmentAttachments || listItem.equipment.equipmentAttachments.length === 0)  &&
                          <span> none</span>
                        }
                      </div>
                      }
                    </td>
                    <td>{ owner && owner.organizationName }</td>
                    <td>{ owner && owner.primaryContact && `${owner.primaryContact.givenName} ${owner.primaryContact.surname}` }</td>
                    <td>{ owner && owner.primaryContact && owner.primaryContact.workPhoneNumber }</td>
                    <td>{ owner && owner.primaryContact && owner.primaryContact.mobilePhoneNumber }</td>
                    <td>
                      <ButtonGroup>
                        {(() => {
                          listItem.showAllResponseFields = showAllResponseFields;
                          if (listItem.maximumHours) {
                            return (
                              <OverlayTrigger 
                                trigger="click" 
                                placement="top" 
                                title="This piece of equipment is has met or exceeded its Maximum Allowed Hours for this year. Are you sure you want to edit the Offer on this equipment?"
                                rootClose 
                                overlay={ <Confirm onConfirm={ this.openHireOfferDialog.bind(this, listItem) }/> }
                              >
                                <Button 
                                  bsStyle="link"
                                  bsSize="xsmall"
                                >
                                  Max. hours reached
                                </Button>
                              </OverlayTrigger>
                            );
                          }
                          if (rentalRequest.status === STATUS_IN_PROGRESS && (listItem.offerResponse === STATUS_ASKED || !listItem.offerResponse)) {
                            return (
                              <Button 
                              bsStyle="link" 
                                title="Show Offer" 
                                onClick={ this.openHireOfferDialog.bind(this, listItem) }
                              >
                                { this.renderStatusText(listItem) }
                              </Button>
                            );
                          }
                          return this.renderStatusText(listItem);
                        })()}
                      </ButtonGroup>
                    </td>
                  </tr>
                );
              })
            }
          </TableControl>;
        })()}
      </Well>

      <Well className="history">
        <h3>History <span className="pull-right"></span></h3>
        { rentalRequest.historyEntity &&
          <History historyEntity={ rentalRequest.historyEntity } refresh={ !this.state.loading } />
        }
      </Well>
      { this.state.showEditDialog &&
        <RentalRequestsEditDialog 
          show={ this.state.showEditDialog } 
          onSave={ this.saveEdit } 
          onClose={ this.closeEditDialog } 
        />
      }
      { this.state.showHireOfferDialog &&
        <HireOfferEditDialog 
          show={ this.state.showHireOfferDialog } 
          hireOffer={ this.state.rotationListHireOffer } 
          onSave={ this.saveHireOffer } 
          onClose={ this.closeHireOfferDialog } 
          error={ this.props.rentalRequestRotationList.error }
        />
      }
      { this.state.showDocumentsDialog &&
        <DocumentsListDialog 
          show={ this.state.showDocumentsDialog } 
          parent={ rentalRequest } 
          onClose={ this.closeDocumentsDialog } 
        />
      }
       { this.state.showNotesDialog &&
        <NotesDialog 
          show={ this.state.showNotesDialog } 
          onSave={ Api.addRentalRequestNote } 
          id={ this.props.params.rentalRequestId }
          getNotes={ Api.getRentalRequestNotes }
          onUpdate={ Api.updateNote }
          onClose={ this.closeNotesDialog } 
          notes={ this.props.notes }
        />
      } 
    </div>;
  },
});


function mapStateToProps(state) {
  return {
    rentalRequest: state.models.rentalRequest,
    rentalRequestRotationList: state.models.rentalRequestRotationList,
    rentalAgreement: state.models.rentalAgreement,
    notes: state.models.rentalRequestNotes,
    attachments: state.models.rentalRequestAttachments,
    documents: state.models.documents,
    history: state.models.rentalRequestHistory,
  };
}

export default connect(mapStateToProps)(RentalRequestsDetail);
