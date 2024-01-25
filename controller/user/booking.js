import express from "express";
import Appointment from "../../model/appointment.js";
import catchAsyncErrors from "../../middlewares/catchAsyncErrors.js";
import { isAuthenticated } from "../../middlewares/auth.js";
import pkg from "jsonwebtoken";
import User from "../../model/user.js";
import Staff from "../../model/staff.js";
import sendMail from "../../utils/sendMail.js";
import staff from "../../model/staff.js";
const { verify } = pkg;
const router = express.Router();

router.post(
  "/create-appointment",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { staffId, desc, date, time, booking_title } = req.body;
      
      if (!booking_title || !desc || !date || !time || !staffId) {
          return res.status(400).json({ error: "Please input all fields" });
        }
        
        const user = await User.findById(req.user?._id);
        
        console.log(user);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const staff = await Staff.findById(staffId);

      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }

      const existingAppointment = await Appointment.findOne({ date, time });

      if (existingAppointment) {
        console.log("The time slot is already booked.");
        return res.status(400).json({ error: "This time has already been booked" });
      }

      const appointment = new Appointment({
        userId: user._id,
        staffId,
        staffEmail: staff.email,
        staffName: staff.name,
        staffRole: staff.role,
        desc,
        date,
        time,
        booking_title,
      });

      const savedAppointment = await appointment.save();

      try {
        await sendMail({
          email: user.email,
          subject: "Appointment Booked",
          html: `<p>You successfully booked an appointment with <strong>${staff.name}</strong>. You would recieve a mail when your appointment is approved.</p>`,
        });
        await sendMail({
          email: staff.email,
          subject: "New Appointment!",
          html: `<p>You have a new appointment request from <strong>${user.name}</strong>. Login to your dashboard to view more details and approve request.</p>`,
        });
        return res.status(201).json({
          success: true,
          savedAppointment,
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

router.post(
  "/approve-appointment",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ error: "Please input all fields" });
      }

      const user = await User.findById(req.user?._id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const staff = await Staff.findById(appointment?.staffId);

      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }

      (appointment.isCancelled = true), await appointment.save();

      try {
        await sendMail({
          email: user.email,
          subject: "Appointment Cancelled",
          html: `<p>You successfully cancelled your appointment with <strong>${staff.name}</strong>.</p>`,
        });
        await sendMail({
          email: staff.email,
          subject: "Appointment Cancelled!",
          html: `<p><strong>${user.name}</strong> cancelled an appointment with you.</p>`,
        });
        return res.status(200).json({
          success: true,
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

router.post(
  "/cancel-appointment",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({ error: "Please input all fields" });
      }

      const user = await User.findById(req.user?._id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const staff = await Staff.findById(appointment?.staffId);

      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }

      (appointment.isCancelled = true), await appointment.save();

      try {
        await sendMail({
          email: user.email,
          subject: "Appointment Cancelled",
          html: `<p>You successfully cancelled your appointment with <strong>${staff.name}</strong>.</p>`,
        });
        await sendMail({
          email: staff.email,
          subject: "Appointment Cancelled!",
          html: `<p><strong>${user.name}</strong> cancelled an appointment with you.</p>`,
        });
        return res.status(200).json({
          success: true,
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);

router.get(
  "/get-appointments",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const appointments = await Appointment.find({ userId: req.user?._id });

      if (!appointments) {
        return res.status(400).json({ error: "No record found!" });
      }

      const reversedAppointments = appointments.reverse();

      return res.status(200).json({
        success: true,
        appointments: reversedAppointments,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  })
);

router.get(
  "/u-get-staffs",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const staffs = await staff.find();

      if (!staffs) {
        return res.status(400).json({ error: "User doesn't exists" });
      }

      return res.status(200).json({
        success: true,
        staffs,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  })
);


export default router;
