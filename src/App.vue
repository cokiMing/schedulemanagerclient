<template>
	<!-- <div id="app">
      <img src="./assets/logo.png">
      <router-view/>
    </div> -->
	<el-container style="height: 1000px; border: 1px solid #eee">
    <!-- 菜单 -->
		<el-aside width="225px" style="background-color: #eeeeee">
			<!-- <div style="height: 60px; text-align: center">Schedule Manager</div> -->
			<el-header style="text-align: left; font-size: 12px">
				<el-dropdown>
				</el-dropdown>
				<span class= "band">Schedule Manager</span>
			</el-header>
			<el-menu>
					<template slot="title"><i class="el-icon-menu"></i>Guide</template>
					<el-menu-item index="1-1" @click="newFormVisible = true">Create a new Schedule</el-menu-item>
					<el-menu-item index="1-2" v-on:click="listRunningSchs">List Running Schedules</el-menu-item>
					<el-menu-item index="1-3" v-on:click="listFiredSchs">List Fired Schedules</el-menu-item>
					<el-menu-item index="1-4" v-on:click="listDeleteJobs">Recycle Bin</el-menu-item>
          <el-menu-item index="1-5" >About cronExpression</el-menu-item>
					<el-menu-item index="1-6" >About us</el-menu-item>
			</el-menu>
		</el-aside>

		<el-container>
			<el-header style="text-align: left; font-size: 12px">
				<el-dropdown>
				</el-dropdown>
			</el-header>
      <!-- 定时任务列表 -->
			<el-main>
				<el-table :data="tableData">
					<el-table-column prop="name" label="name" width="200" >
					</el-table-column>
					<el-table-column prop="cron" label="cronExpression" width="150">
					</el-table-column>
					<el-table-column prop="project" label="project">
					</el-table-column>
          <el-table-column prop="url" label="url">
					</el-table-column>
					<el-table-column prop="description" label="description">
					</el-table-column>
					<span v-show:false prop="id"></span>
					<span v-show:false prop="status"></span>
          <el-table-column prop="operation" label="operation">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="primary"
                @click="showScheduleLog(scope.$index,scope.row)"
								round>logs</el-button>
							<el-button
	               size="mini"
	               type="info"
	               @click="editSchedule(scope.$index,scope.row)"
								 round
								 v-show='scope.row.status == "CREATE"'>edit</el-button>
							<el-button
	 	               size="mini"
	 	               type="success"
	 	               @click="editSchedule(scope.$index,scope.row)"
	 								 round
	 								 v-show='scope.row.status == "DELETE" || scope.row.status == "FIRED"'>resume</el-button>
              <el-button
                size="mini"
                type="danger"
                @click="confirmDelete(scope.$index,scope.row)"
								round
								v-show='scope.row.status == "CREATE"'>delete</el-button>
            </template>
					</el-table-column>
				</el-table>
			</el-main>
		</el-container>

    <!-- 执行日志 -->
    <el-dialog title="Schedule Running Log" style="width: 120%; margin-left: -10%" :visible.sync="dialogTableVisible">
      <el-table :data="logData">
        <el-table-column property="id" label="id" width="150">
				</el-table-column>
        <el-table-column property="executeTime" label="executeTime" width="200">
				</el-table-column>
        <el-table-column property="result" label="result">
				</el-table-column>
        <el-table-column property="failTimes" label="failTimes">
				</el-table-column>
				<el-table-column property="cause" label="cause">
				</el-table-column>
      </el-table>
      <div class="block" style="padding-top:20px;">
        <el-pagination
          layout="prev, pager, next"
          :total="Page.pageNum"
					:current-page.sync="Page.currentPage"
					@current-change="getJobLogsByJobId(jobIdCache,Page.currentPage,Page.pageSize)">
        </el-pagination>
      </div>
    </el-dialog>

    <!-- 新建定时任务表单 -->
    <el-dialog title="New Schedule" :visible.sync="newFormVisible">
        <el-form :model="form" label-position="left" >
          <el-form-item label="name" :label-width="formLabelWidth" size="small">
            <el-input v-model="form.name" auto-complete="off" style="width: 150px"></el-input>
          </el-form-item>
          <el-form-item label="cron" :label-width="formLabelWidth" size="small">
            <el-input v-model="form.cron" auto-complete="off" style="width: 200px"></el-input>
          </el-form-item>
          <el-form-item label="project" :label-width="formLabelWidth" size="small">
            <el-input v-model="form.project" auto-complete="off" style="width: 150px"></el-input>
          </el-form-item>
          <el-form-item label="requestMethod" :label-width="formLabelWidth">
            <el-radio-group v-model="form.method">
              <el-radio :label="0">GET</el-radio>
              <el-radio :label="1">POST</el-radio>
              <el-radio :label="2">PUT</el-radio>
              <el-radio :label="3">DELETE</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="url" :label-width="formLabelWidth">
            <el-input v-model="form.url" auto-complete="off" style="width: 80%">
              <template slot="prepend">http://</template>
            </el-input>
          </el-form-item>
          <el-form-item label="description" :label-width="formLabelWidth">
            <el-input v-model="form.description" type="textarea" auto-complete="off" style="width: 300px"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="createSchedule()">Save</el-button>
            <el-button @click="newFormVisible = false">Cancel</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>

			<!-- 更改任务信息 -->
			<el-dialog title="Edit Schedule" :visible.sync="editFormVisible" @close="clearForm">
	        <el-form :model="form" label-position="left" >
	          <el-form-item label="name" :label-width="formLabelWidth" size="small">
	            <span style="width: 150px">{{form.name}}</span>
	          </el-form-item>
	          <el-form-item label="cron" :label-width="formLabelWidth" size="small">
	            <el-input v-model="form.cron" auto-complete="off" style="width: 300px"></el-input>
	          </el-form-item>
	          <el-form-item label="project" :label-width="formLabelWidth" size="small">
	            <span style="width: 150px">{{form.project}}</span>
	          </el-form-item>
	          <el-form-item label="url" :label-width="formLabelWidth">
							<el-input v-model="form.url" auto-complete="off" style="width: 80%">
	            </el-input>
	          </el-form-item>
	          <el-form-item label="description" :label-width="formLabelWidth">
	            <el-input v-model="form.description" type="textarea" auto-complete="off" style="width: 300px"></el-input>
	          </el-form-item>
	          <el-form-item>
	            <el-button type="primary" @click="updateSchedule(false)">Save</el-button>
	            <el-button @click="editFormVisible = false">Cancel</el-button>
	          </el-form-item>
	        </el-form>
	      </el-dialog>

				<!-- 恢复任务信息 -->
				<el-dialog title="Resume Schedule" :visible.sync="resumeFormVisible" @close="clearForm">
		        <el-form :model="form" label-position="left" >
		          <el-form-item label="name" :label-width="formLabelWidth" size="small">
		            <span style="width: 150px">{{form.name}}</span>
		          </el-form-item>
		          <el-form-item label="cron" :label-width="formLabelWidth" size="small">
		            <el-input v-model="form.cron" auto-complete="off" style="width: 300px"></el-input>
		          </el-form-item>
		          <el-form-item label="project" :label-width="formLabelWidth" size="small">
		            <span style="width: 150px">{{form.project}}</span>
		          </el-form-item>
		          <el-form-item label="url" :label-width="formLabelWidth">
								<el-input v-model="form.url" auto-complete="off" style="width: 80%">
		            </el-input>
		          </el-form-item>
		          <el-form-item label="description" :label-width="formLabelWidth">
								<span style="width: 150px">{{form.description}}</span>
		          </el-form-item>
		          <el-form-item>
		            <el-button type="primary" @click="updateSchedule(true)">Resume</el-button>
		            <el-button @click="editFormVisible = false">Cancel</el-button>
		          </el-form-item>
		        </el-form>
		      </el-dialog>
	</el-container>

</template>

<script>
    export default {
        name: 'app',
        data() {
            return {
                head: 'Schedule Manager',
                methods: [
                  'GET','POST','PUT','DELETE'
                ],
                host: '10.0.0.104:9301',
								// host: '127.0.0.1:9301',
                tableData: [],
                logData:[
                ],
								jobIdCache:'',
                newFormVisible: false,
								editFormVisible: false,
                dialogTableVisible: false,
								resumeFormVisible: false,
								Page: {
									currentPage:1,
									pageSize:10,
									total:50,
									pageNum:5
								},
                form: {
									id:'',
                  name: '',
                  cron: '',
                  url:'',
                  method:0,
									jobName:'',
                  project: '',
                  description:'',
									status:''
                },
								tbEnable:true,
                formLabelWidth: '120px'
            }
        },
        methods: {
            //获取所有运行中的任务
            listRunningSchs:function() {
                this.$http.get('http://'+ this.host +'/scheduleManager/getRunningJobs', {}, {
                    headers: {
                    },
                    emulateJSON: true
                }).then(function(response) {
                    // 这里是处理正确的回调
                    var runningSchs = response.data["content"]
                    this.tableData = new Array();
                    for (var i = 0; i < runningSchs.length; i++) {
												var temp = {
			                  	name: '2016-05-02',
			                  	cron: '王小虎',
			                  	url: 'url',
													jobName: '',
			                  	project: 'aaa',
			                  	description: '2017-06-07 11:23:00'
			                	}
												temp.id = runningSchs[i].id;
                        temp.name = runningSchs[i].name;
                        temp.cron = runningSchs[i].cronExpression;
                        temp.project = runningSchs[i].project;
                        temp.url = runningSchs[i].url;
												temp.jobName = runningSchs[i].jobName;
                        temp.description = runningSchs[i].description;
												temp.status = runningSchs[i].status;
                        this.tableData[i] = temp;
                    }
                }, function(response) {
                    // 这里是处理错误的回调
                    console.log(response)
                });
            },
						//
						listFiredSchs:function() {
							this.$http.get('http://'+ this.host +'/scheduleManager/getFiredJobs', {}, {
									headers: {
									},
									emulateJSON: true
							}).then(function(response) {
									// 这里是处理正确的回调
									var runningSchs = response.data["content"]
									this.tableData = new Array();
									for (var i = 0; i < runningSchs.length; i++) {
											var temp = {
												name: '2016-05-02',
												cron: '王小虎',
												url: 'url',
												jobName: '',
												project: 'aaa',
												description: '2017-06-07 11:23:00'
											}

											temp.name = runningSchs[i].name;
											temp.cron = runningSchs[i].cronExpression;
											temp.project = runningSchs[i].project;
											temp.url = runningSchs[i].url;
											temp.jobName = runningSchs[i].jobName;
											temp.description = runningSchs[i].description;
											temp.id = runningSchs[i].id;
											temp.status = runningSchs[i].status;
											this.tableData[i] = temp;
									}
							}, function(response) {
									// 这里是处理错误的回调
									console.log(response)
							});
						},
						listDeleteJobs:function() {
							this.$http.get('http://'+ this.host +'/scheduleManager/getDeleteJobs', {}, {
									headers: {
									},
									emulateJSON: true
							}).then(function(response) {
									// 这里是处理正确的回调
									var runningSchs = response.data["content"]
									this.tableData = new Array();
									for (var i = 0; i < runningSchs.length; i++) {
											var temp = {
												name: '',
												cron: '',
												url: '',
												jobName: '',
												project: '',
												description: ''
											}

											temp.name = runningSchs[i].name;
											temp.cron = runningSchs[i].cronExpression;
											temp.project = runningSchs[i].project;
											temp.url = runningSchs[i].url;
											temp.jobName = runningSchs[i].jobName;
											temp.description = runningSchs[i].description;
											temp.id = runningSchs[i].id;
											temp.status = runningSchs[i].status;
											this.tableData[i] = temp;
									}
							}, function(response) {
									// 这里是处理错误的回调
									console.log(response)
							});
						},
            //获取某个任务的运行日志
            getJobLogsByJobId:function(jobId,pageNo,pageSize) {
							  this.jobIdCache = jobId
                this.$http.get('http://'+ this.host +'/scheduleManager/getJobLogsByJobId?'
                    + 'jobId=' + this.jobIdCache + '&pageNo=' + pageNo + '&pageSize=' + pageSize, {}, {
                    headers: {
                    },
										emulateJSON: true
                }).then(function(response) {
                    // 这里是处理正确的回调
										this.logData = new Array();
										this.Page.pageNum = this.Page.pageSize * response.data.content.pageNum;
										var logs = response.data.content.logList;
										for (var i = 0; i < logs.length; i++) {
											var temp = {
												id: 0,
												executeTime:'',
												result:'',
												failTimes:''
											}
											temp.id = i + 1 + (this.Page.currentPage - 1) * this.Page.pageSize;
											temp.executeTime = logs[i].executeTime;
											temp.result = logs[i].executeResult;
											temp.failTimes = logs[i].failTimes;
											temp.cause = logs[i].exception;

											this.logData[i] = temp;
										}
										this.dialogTableVisible = true
                }, function(response) {
                    // 这里是处理错误的回调
                    console.log(response)
                });
            },
            //生成定时任务
            createSchedule:function() {
              this.$http.post('http://'+ this.host +'/scheduleManager/createScheduleByCron'
                  , {
                    name:this.form.name,
                    url:'http://'+this.form.url,
                    method:this.methods[this.form.method],
                    cronExpression: this.form.cron,
                    project:this.form.project,
                    description:this.form.description
                  }, {
              }).then(function(response) {
                  // 这里是处理正确的回调
                  console.log(response.data)
									var serverMessage = response.data.message
                  if (response.data.code != '1') {
                    this.messageInfo(false,serverMessage);
                    console.log('exception')
                  } else {
										this.messageInfo(true,serverMessage);
                    this.newFormVisible = false
                    this.listRunningSchs()
                  }
              }, function(response) {
                  // 这里是处理错误的回调
                  this.messageInfo(false,'unknow server error');
                  console.log(response)
              });
            },
						//缓存定时任务
						editSchedule(index, row){
							this.form.id = row.id;
							this.form.name = row.name;
							this.form.cron = row.cron;
							this.form.url = row.url;
							this.form.jobName = row.jobName;
							this.form.project = row.project;
							this.form.status = row.status;
							this.form.description = row.description;
							if (row.status == 'CREATE') {
								this.editFormVisible = true;
							} else {
								this.resumeFormVisible = true;
							}
						},
						//更新定时任务
						updateSchedule(isResume) {
							this.$http.put('http://'+ this.host +'/scheduleManager/updateJobById'
                  , {
                    id:this.form.id,
                    cronExpression: this.form.cron,
                    description:this.form.description,
										url:this.form.url
                  }, {
              }).then(function(response) {
                  // 这里是处理正确的回调
                  console.log(response.data)
									var serverMessage = response.data.message
                  if (response.data.code != '1') {
                    this.messageInfo(false,serverMessage);
                    console.log('exception')
                  } else {
										this.messageInfo(true,serverMessage);
										if (isResume) {
											this.resumeFormVisible = false;
										} else {
											this.editFormVisible = false;
										}
										var status = this.form.status;
										// if (status == 'CREAT') {
										// 	this.listRunningSchs()
										// }
										console.log(this.form);
										switch (status) {
											case 'CREATE':
												this.listRunningSchs();
												break;
											case 'DELETE':
												this.listDeleteJobs();
												break;
											case 'FIRED':
												this.listFiredSchs();
												break;
											default:
												break;
										}
                  }
              }, function(response) {
                  // 这里是处理错误的回调
                  this.messageInfo(false,'unknow server error');
                  console.log(response)
              });
						},
						//销毁定时任务
						removeSchedule(index,row) {
							this.$http.delete('http://'+ this.host +'/scheduleManager/removeSchedule?'
									+ 'id=' + row.id, {}, {
									headers: {
									},
									emulateJSON: true
							}).then(function(response) {
									// 这里是处理正确的回调
									if ('1' == response.data.code) {
										this.messageInfo(true,'success')
										this.listRunningSchs()
									} else {
										this.messageInfo(false,response.data.message)
									}
							}, function(response) {
									// 这里是处理错误的回调
									console.log(response)
									this.messageInfo(false,response.data.message)
							});
							// this.handleDelete(index,row)
						},
            showScheduleLog(index, row) {
							this.getJobLogsByJobId(row.id,1,10)
            },
            clearForm() {
							this.form.id = '';
							this.form.name = '';
							this.form.cron = '';
							this.form.url = '';
							this.form.jobName = '';
							this.form.project = '';
							this.form.description = '';
            },
            messageInfo(isSuccess,content) {
              this.$notify({
								title:'message',
                message: content,
                type:isSuccess?'success':'error'
              })
            },
						confirmDelete(index,row) {
							this.$confirm('Remove this schedule?', 'Waring', {
          			confirmButtonText: 'Confirm',
          			cancelButtonText: 'Cancel',
          			type: 'warning'
        			}).then(() => {
								this.removeSchedule(index,row)
        			}).catch(() => {

        			});
						}
        },
        created: function() {
            this.listRunningSchs()
        }
    }
</script>

<style>
	#app {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-align: center;
		color: #2c3e50;
		margin-top: 60px;
	}

  .el-form-item {
    padding-left: 10%
  }

	.el-header {
		background-color: #B3c9D1;
		color: #333;
		line-height: 60px;
	}

	.el-aside {
		color: #333;
	}

	.band {
		color: white;
		font-family: 'Arial';
		font-size: 20px;
	}
</style>
