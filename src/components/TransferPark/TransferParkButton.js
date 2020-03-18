import React from "react";
import { connect } from "react-redux";
import { IconButton, withTaskContext } from "@twilio/flex-ui";
import { css } from "emotion";
import CircularProgress from "@material-ui/core/CircularProgress";
import { TransferPark } from "./TransferPark";

const buttoncss = css`
  background-color: #ff9800;
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 2px;
  border-radius: 50%;
`;

class TransferParkButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false
    };
  }

  isDisabled = props => {
    return false;
  };

  proxyToMethod = () => {
    this.setState({ isLoading: true });

    let { workerContactUri, workerSid, task } = this.props;

    TransferPark(task, workerContactUri, workerSid)
      .then(result => {
        this.setState({ isLoading: false });
      })
      .catch(e => {
        this.setState({ isLoading: false });
      });
  };

  render() {
    if (!this.props.task) {
      return false;
    }

    if (this.state.isLoading) {
      return <CircularProgress size={28} />;
    } else {
      return (
        <IconButton
          key="transfer-park-call"
          className={buttoncss}
          disabled={this.isDisabled(this.props)}
          icon="EyeBold"
          onClick={this.proxyToMethod}
        />
      );
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    workerSid: state.flex.worker.worker.sid,
    workerContactUri: state.flex.worker.attributes.contact_uri
  };
};

export default connect(mapStateToProps)(withTaskContext(TransferParkButton));
