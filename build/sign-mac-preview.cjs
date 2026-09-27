// Local ad-hoc signatures make Apple Silicon executables loadable. This does
// not certify the publisher and does not contact Apple's notarization service.
const { signAsync } = require('@electron/osx-sign');
exports.sign = async options => {
  await signAsync({ ...options, identity: '-', identityValidation: false });
};
