(function () {
  "use strict";

  const approvedAction = "批准";
  const rejectedAction = "驳回";
  const manageApp = {
    //年假管理应用的id，请优先修改。比如你的年假管理应用id为123
    id: 507,
    yearField: "year",
    daysField: "days",
    userIdField: "userId",
  };
  const approveApp = {
    userIdField: "userId",
    daysField: "days",
  };

  // 1 流程处理 自定义触发的时机（事件）此代码复制时，请带上引号 请参考 https://cybozudev.kf5.com/hc/kb/article/1303568/
  kintone.events.on("app.record.detail.process.proceed", async (event) => {
    const { action, record } = event;

    // 2 判断是否为批准动作。只有批准动作才会更新到年间管理应用
    if (action.value === approvedAction) {
      // 3 获取申请年假的用户id
      const userInfo = record[approveApp.userIdField].value;
      if (userInfo.length === 0) {
        alert("请先选择用户");
        return false;
      }

      // 4 获取年假申请天数，并且转换成数字
      const days = Number(record[approveApp.daysField].value);

      //5 设置查询年假管理应用的条件--用户id相同，并且年份字段的值为今年
      const thisYear = new Date().getFullYear();
      const query = `${manageApp.userIdField} in ("${userInfo[0].code}") and ${manageApp.yearField} = ${thisYear} limit 1`;
      const params = {
        app: manageApp.id,
        query,
      };

      // 6 通过查询条件批量获取该用户的剩余年假信息，restapi列表查询 https://cybozudev.kf5.com/hc/kb/article/1303627/
      const manageResult = await kintone.api(
        kintone.api.url("/k/v1/records", true),
        "GET",
        params
      );

      // 7 如果没有记录，则给出错误提示。
      if (manageResult.records.length < 1) {
        event.error = "该用户还未登记年假信息";
      }

      // 8 通过剩余年假与申请的年假数，来判断是否还有年假可以申请
      else if (
        Number(manageResult.records[0][manageApp.daysField].value) < days
      ) {
        event.error = "年假不足";
      } else {
        // 准备更新年假管理应用的信息
        const manageLeftDays = Number(
          manageResult.records[0][manageApp.daysField].value
        );

        // 9 计算新的剩余年假
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

        // 10 通过记录id来更新年假管理应用  请参考 https://cybozudev.kf5.com/hc/kb/article/1303627/
        return kintone
          .api(kintone.api.url("/k/v1/record", true), "PUT", updateInfo)
          .then(() => {
            alert("更新成功");
            return event;
          });
      }
    }
    return event;
  });
})();
