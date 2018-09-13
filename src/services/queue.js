/*
 * A queue to decouple API server from the outgoing requests
 * done by `workers`.
 *
 * Currently, we utilize node's internal queue. It is possible
 * that this will be replaced by a proper standalone message
 * queue in the future.
 */
class Queue {
  enqueue (notification) {
    // TODO: relay the notification to workers
  }
}

let _Q;

function get () {
  if (!_Q) {
    _Q = new Queue();
  }
  return _Q;
}

module.exports = {
  get: get,
};
