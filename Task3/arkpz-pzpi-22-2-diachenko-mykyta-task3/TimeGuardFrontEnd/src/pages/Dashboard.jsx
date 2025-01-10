import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import TaskProgress from '../components/Dashboard/TaskProgress';
import TimeTrackingCalendar from '../components/Dashboard/TimeTrackingCalendar';
import WeeklyMonthlyStatistics from '../components/Dashboard/WeeklyMonthlyStatistics';
import Achievements from '../components/Dashboard/Achievements';
import TaskDistribution from '../components/Dashboard/TaskDistribution';
import ActivityFeed from '../components/Dashboard/ActivityFeed';
import PerformanceMetrics from '../components/Dashboard/PerformanceMetrics';
import UpcomingDeadlines from '../components/Dashboard/UpcomingDeadlines';
import Header from '../components/Header';

const Dashboard = () => {
  return (
    <Container fluid className="mt-4 dashboard">
      <Header />
      <h2>Dashboard</h2>
      <Row className="mb-4">
        <Col md={4}>
          <PerformanceMetrics />
        </Col>
        <Col md={4}>
          <TaskProgress />
        </Col>
        <Col md={4}>
          <TaskDistribution />
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6}>
          <WeeklyMonthlyStatistics reportType="weekly_statistics" />
        </Col>
        <Col md={6}>
          <WeeklyMonthlyStatistics reportType="monthly_statistics" />
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6}>
          <Achievements />
        </Col>
        <Col md={6}>
          <UpcomingDeadlines />
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={12}>
          <TimeTrackingCalendar />
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={12}>
          <ActivityFeed />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
