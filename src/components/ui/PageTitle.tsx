
export const PageTitle = ({ title }: { title: string }) => {
    return (
        <div className="fixed top-[6px] z-50 text-gray-50 text-xl ml-8 md:ml-0">
            <span>{title}</span>
        </div>
    )
};