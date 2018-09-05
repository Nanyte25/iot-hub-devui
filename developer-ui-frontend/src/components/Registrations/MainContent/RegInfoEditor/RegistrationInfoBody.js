/*
 * Copyright 2018 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
 */
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { withRouter, matchPath } from "react-router-dom";
import { TransitionMotion, Motion, spring, presets } from "react-motion";
import Measure from "react-measure";
// Redux
import { connect } from "react-redux";
import { updateRegistrationInfo } from "actions/RegistrationActions";
// Child Components
import JsonView from "components/common/JsonView";
import JsonEditor from "components/common/JsonEditor";
import { Route } from "react-router-dom";

class RegistrationInfoBodyWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rawViewShown: Boolean(
        matchPath(props.history.location.pathname, {
          path: "/registrations/:selectedDeviceId/registration/raw",
          exact: false,
          strict: false
        })
      ),
      height: -1,
      editorTransition: "none" // "none" | "leaving" | "entering"
    };
    this.handleEditorSave = this.handleEditorSave.bind(this);
    this.redirectToReadOnly = this.redirectToReadOnly.bind(this);
  }

  redirectToReadOnly() {
    const { history, match } = this.props;
    history.push(
      `/registrations/${match.params.selectedDeviceId}/registration`
    );
  }

  handleEditorSave(newInfo) {
    const { regInfo } = this.props;
    const { "device-id": deviceId, ...info } = newInfo;
    const enabledChanged = info.enabled !== regInfo;
    this.props
      .updateRegistrationInfo(deviceId, info, enabledChanged)
      .then(this.redirectToReadOnly);
  }

  render() {
    const { rawViewShown, editorTransition, height } = this.state;
    return (
      <Route
        path="/registrations/:selectedDeviceId/registration/:regInfoSubMenu?"
        render={({ match }) => (
          <Measure
            scroll
            onResize={contentRect => {
              this.setState({ height: contentRect.scroll.height });
            }}>
            {({ measureRef }) => (
              <Motion
                style={{
                  height: spring(height, presets.noWobble)
                }}
                defaultStyle={{ height: 0 }}>
                {interpolatingStyle => (
                  <div style={interpolatingStyle}>
                    <div className="measuring-container" ref={measureRef}>
                      <TransitionMotion
                        willLeave={() => {
                          editorTransition !== "leaving" &&
                            this.setState({ editorTransition: "leaving" });
                          return { y: spring(15) };
                        }}
                        willEnter={() => {
                          this.setState({
                            rawViewShown: true,
                            editorTransition: "entering"
                          });
                          return { y: 15 };
                        }}
                        didLeave={() =>
                          this.setState({
                            rawViewShown: false,
                            editorTransition: "none"
                          })
                        }
                        config={{ stiffness: 360, damping: 30 }}
                        styles={
                          match.params.regInfoSubMenu === "raw"
                            ? [{ key: "editor", style: { y: spring(0) } }]
                            : []
                        }>
                        {interpolatedStyles => (
                          <Fragment>
                            {interpolatedStyles.map(config => (
                              <JsonEditor
                                className={
                                  editorTransition !== "none"
                                    ? editorTransition
                                    : ""
                                }
                                editorConfig={{ statusBar: false }}
                                value={this.props.regInfo}
                                onSubmit={this.handleEditorSave}
                                onCancel={this.redirectToReadOnly}
                                key={config.key}
                                style={{
                                  transform: `translateY(${-1 *
                                    config.style.y}px)`
                                }}
                              />
                            ))}
                          </Fragment>
                        )}
                      </TransitionMotion>
                      {!rawViewShown &&
                        !match.params.regInfoSubMenu && (
                          <JsonView {...this.props} />
                        )}
                    </div>
                  </div>
                )}
              </Motion>
            )}
          </Measure>
        )}
      />
    );
  }
}

RegistrationInfoBodyWrapped.propTypes = {
  regInfo: PropTypes.object.isRequired,
  isFetching: PropTypes.bool.isRequired,
  updateRegistrationInfo: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

const RegistrationInfoBody = withRouter(
  connect(
    null,
    { updateRegistrationInfo }
  )(RegistrationInfoBodyWrapped)
);

export default RegistrationInfoBody;
