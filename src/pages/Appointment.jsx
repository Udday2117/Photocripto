import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {
    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)

    const [docInfo, setDocInfo] = useState(null)
    const [selectedDate, setSelectedDate] = useState(null)
    const [slotTime, setSlotTime] = useState('')
    const [weekDates, setWeekDates] = useState([])

    const navigate = useNavigate()

    useEffect(() => {
        if (doctors.length > 0) {
            const doc = doctors.find((doc) => doc._id === docId)
            if (doc) {
                setDocInfo(doc)
                generateWeekDates()
            }
        }
    }, [doctors, docId])

    // Generate dates for the next 7 days
    const generateWeekDates = () => {
        let today = new Date()
        let datesArray = []
        for (let i = 0; i < 7; i++) {
            let date = new Date(today)
            date.setDate(today.getDate() + i)
            datesArray.push(date)
        }
        setWeekDates(datesArray)
        setSelectedDate(datesArray[0]) // Set default date to today
    }

    // Function to filter only future slots for the selected date
    const getFilteredSlots = () => {
        if (!docInfo || !selectedDate) return []

        let currentTime = new Date()
        let selectedDateTime = new Date(selectedDate)
        
        return docInfo.available_slots.filter((time) => {
            let [hour, minutePart] = time.split(':')
            let minute = parseInt(minutePart.slice(0, 2))
            let ampm = minutePart.slice(-2)

            // Convert 12-hour format to 24-hour format
            if (ampm === 'PM' && hour !== "12") {
                hour = parseInt(hour) + 12
            } else if (ampm === 'AM' && hour === "12") {
                hour = 0
            } else {
                hour = parseInt(hour)
            }

            let slotDateTime = new Date(selectedDateTime)
            slotDateTime.setHours(hour, minute, 0, 0)

            return slotDateTime > currentTime
        })
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        if (!slotTime) {
            toast.error('Please select a slot before booking.')
            return
        }

        if (!selectedDate) {
            toast.error('Please select a date before booking.')
            return
        }

        // Formatting selectedDate
        let day = selectedDate.getDate()
        let month = selectedDate.getMonth() 
        let year = selectedDate.getFullYear()
        const slotDate = `${day}_${month}_${year}`

        try {
            const { data } = await axios.post(
                `${backendUrl}/api/user/book-appointment`,
                { docId, slotDate, slotTime },
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Error booking appointment')
        }
    }

    return docInfo ? (
        <div>
            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>
                        {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
                    </p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>
                    <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>
                        About <img className='w-3' src={assets.info_icon} alt="" />
                    </p>
                    <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    <p className='text-gray-600 font-medium mt-4'>
                        Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span>
                    </p>
                </div>
            </div>

            {/* Booking slots */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p>Select a Date</p>
                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {weekDates.map((date, index) => (
                        <p key={index} onClick={() => setSelectedDate(date)}
                           className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                               selectedDate?.getDate() === date.getDate() ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'
                           }`}>
                            {date.toDateString()}
                        </p>
                    ))}
                </div>

                <p className="mt-6">Available Time Slots</p>
                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {getFilteredSlots().length > 0 ? getFilteredSlots().map((time, index) => (
                        <p key={index} onClick={() => setSlotTime(time)}
                           className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                               time === slotTime ? 'bg-primary text-white' : 'text-[#949494] border border-[#B4B4B4]'
                           }`}>
                            {time}
                        </p>
                    )) : <p className="text-gray-500">No available slots for today !!</p>}
                </div>

                <button onClick={bookAppointment} className='bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-6'>
                    Book an appointment
                </button>
            </div>

            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment
