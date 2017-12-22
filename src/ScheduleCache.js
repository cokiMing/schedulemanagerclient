export default {
    put(jobName,schedule){
      window.localStorage.setItem(jobName,schedule);
    },
    get(jobName) {
      return window.localStorage.getItem(jobName);
    }
}
