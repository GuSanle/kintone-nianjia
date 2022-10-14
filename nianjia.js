(function () {
  "use strict";

  const approvedAction = "批准";
  const rejectedAction = "驳回";
  const manageApp = {
    id: 1723,
    yearField: "year",
    daysField: "days",
    userIdField: "userId",
  };
  const approveApp = {
    userIdField: "userId",
    daysField: "days",
  };

  // 流程处理
  kintone.events.on("app.record.detail.process.proceed", async (event) => {
    const { action, record } = event;
    // 判断是否为批准动作。只有批准动作才会更新到年间管理应用
    if (action.value === approvedAction) {
      // 1 获取申请年假的用户id
      const userInfo = record[approveApp.userIdField].value;
      if (userInfo.length === 0) {
        alert("请先选择用户");
        return false;
      }
      // 2 获取年假申请天数
      const days = Number(record[approveApp.daysField].value);
      // 3 设置查询年假管理应用的条件
      const thisYear = new Date().getFullYear();
      const query = `${manageApp.userIdField} in ("${userInfo[0].code}") and ${manageApp.yearField} = ${thisYear} limit 1`;
      const params = {
        app: manageApp.id,
        query,
      };
      // 4 获取该用户的剩余年假信息
      const manageResult = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        params
      );
      // 5 如果没有记录，则提示该用户还未登记年假信息。
      if (manageResult.records.length < 1) {
        event.error = "该用户还未登记年假信息";
      }
      // 6 如果剩余年假小于申请的年假数，则提示年假不足
      else if (
        Number(manageResult.records[0][manageApp.daysField].value) < days
      ) {
        event.error = "年假不足";
      } else {
        // 7 准备更新年假管理应用的信息
        const manageLeftDays = Number(
          manageResult.records[0][manageApp.daysField].value
        );
        const newleftDays = manageLeftDays - days;
        const updateInfo = {
          app: manageApp.id,
          id: manageResult.records[0].$id.value,
          record: {
            [manageApp.daysField]: {
              value: newleftDays,
            },
          },
        };
        // 8 通过记录id来更新年假管理应用
        return kintone
          .api(kintone.api.url("/k/v1/record", true), "PUT", updateInfo)
          .then((resp) => {
            console.log(resp, "updateInforesp");
            alert("更新成功");
            return event;
          });
      }
    }
    return event;
  });
})();
